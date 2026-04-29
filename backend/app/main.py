from fastapi import FastAPI, File, UploadFile, Form, Request, Response, HTTPException, Depends
from fastapi import Header
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
import io
import uuid
import datetime
import logging
import os

from app.model import model
from app.preprocess import preprocess_image
from app.firebase import db, bucket, encrypt_data, decrypt_data, encrypt_file, decrypt_file, verify_id_token
from app.grad_cam import get_gradcam_image, get_target_layer_name

app = FastAPI()
logger = logging.getLogger(__name__)


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
UPLOAD_CHUNK_SIZE_BYTES = 1024 * 1024
NORMAL_MAX_SCORE = 0.45
PNEUMONIA_MIN_SCORE = 0.55
DECISION_THRESHOLDS = {
    "normal_max": NORMAL_MAX_SCORE,
    "inconclusive_min": NORMAL_MAX_SCORE,
    "inconclusive_max": PNEUMONIA_MIN_SCORE,
    "pneumonia_min": PNEUMONIA_MIN_SCORE,
}


def get_cors_origins() -> list[str]:
    configured_origins = os.getenv("CORS_ORIGINS")
    if configured_origins:
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]

    return ["http://localhost:5173", "http://127.0.0.1:5173"]


def get_token_from_authorization(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header.")

    return token


async def get_authenticated_uid(
    authorization: str | None = Header(default=None),
    token: str | None = None
) -> str:
    id_token = get_token_from_authorization(authorization) or token
    if not id_token:
        raise HTTPException(status_code=401, detail="Missing Firebase ID token.")

    try:
        decoded_token = verify_id_token(id_token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token.") from exc

    return decoded_token["uid"]


def ensure_matching_user(requested_user_id: str, authenticated_uid: str) -> None:
    if requested_user_id != authenticated_uid:
        raise HTTPException(status_code=403, detail="You can only access your own records.")


def ensure_file_owner(file_path: str, authenticated_uid: str) -> None:
    parts = file_path.split("/")
    if len(parts) < 3 or parts[0] not in {"xrays", "heatmaps"} or parts[1] != authenticated_uid:
        raise HTTPException(status_code=403, detail="You can only access your own files.")


async def read_upload_with_limit(file: UploadFile) -> bytes:
    contents = bytearray()

    while True:
        chunk = await file.read(UPLOAD_CHUNK_SIZE_BYTES)
        if not chunk:
            break

        contents.extend(chunk)
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            )

    return bytes(contents)


def open_validated_image(contents: bytes) -> Image.Image:
    try:
        with Image.open(io.BytesIO(contents)) as image:
            if image.format not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are accepted.")
            image.verify()

        # Reopen after verify(), because Pillow leaves the first image unusable for processing.
        image = Image.open(io.BytesIO(contents))
        image.load()
        return image
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc


def build_backend_url(request: Request, path: str) -> str:
    return f"{str(request.base_url).rstrip('/')}/{path.lstrip('/')}"

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok"}



@app.post("/predict")
async def predict(
    request: Request,
    file: UploadFile = File(...), 
    user_id: str = Form(...),
    patient_id: str = Form(...),
    authenticated_uid: str = Depends(get_authenticated_uid)
):
    ensure_matching_user(user_id, authenticated_uid)

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Only JPEG and PNG are accepted."
        )

    contents = await read_upload_with_limit(file)
    uploaded_blob_paths = []

    try:

        image = open_validated_image(contents)

        logger.debug("Validated upload image: mode=%s size=%s", image.mode, image.size)

        input_tensor = preprocess_image(image)
        prediction = model.predict(input_tensor)

        score = float(prediction[0][0])

        pneumonia_probability = round(score, 4)
        low_confidence = False
        
        if NORMAL_MAX_SCORE <= score <= PNEUMONIA_MIN_SCORE:
            label = "Inconclusive"
            low_confidence = True
            confidence = max(score, 1.0 - score)
        elif score > PNEUMONIA_MIN_SCORE:
            label = "Pneumonia"
            confidence = score
        else:
            label = "Normal"
            confidence = 1.0 - score

        confidence = round(confidence, 4)

        # Encrypt Image and Upload to Firebase Storage
        image_filename = f"xrays/{user_id}/{uuid.uuid4()}.enc"
        encrypted_contents = encrypt_file(contents)
        
        blob = bucket.blob(image_filename)
        blob.upload_from_string(encrypted_contents, content_type="application/octet-stream")
        uploaded_blob_paths.append(image_filename)
        
        # Generate Grad-CAM Heatmap Overlay
        target_layer_name = get_target_layer_name(model)
        heatmap_img = get_gradcam_image(input_tensor, model, target_layer_name, pred_score=score)
        
        # Convert heatmap PIL Image to bytes
        heatmap_io = io.BytesIO()
        heatmap_img.save(heatmap_io, format="JPEG")
        heatmap_bytes = heatmap_io.getvalue()
        
        # Encrypt Heatmap Image and Upload
        heatmap_filename = f"heatmaps/{user_id}/{uuid.uuid4()}.enc"
        encrypted_heatmap = encrypt_file(heatmap_bytes)
        
        heatmap_blob = bucket.blob(heatmap_filename)
        heatmap_blob.upload_from_string(encrypted_heatmap, content_type="application/octet-stream")
        uploaded_blob_paths.append(heatmap_filename)
        
        # Generate backend URLs for the frontend to view the images
        image_url = build_backend_url(request, f"image/{image_filename}")
        heatmap_url = build_backend_url(request, f"image/{heatmap_filename}")

        # Encrypt the sensitive data
        encrypted_label = encrypt_data(label)
        encrypted_score = encrypt_data(str(round(score, 4)))
        encrypted_patient_id = encrypt_data(patient_id)

        # Save to Firestore
        analysis_record = {
            "user_id": user_id,
            "date": datetime.datetime.now(datetime.timezone.utc),
            "image_path": image_filename,
            "heatmap_path": heatmap_filename,
            "encrypted_diagnosis": encrypted_label,
            "encrypted_confidence": encrypted_score,
            "encrypted_patient_id": encrypted_patient_id,
            "low_confidence": low_confidence,
            "decision_thresholds": DECISION_THRESHOLDS
        }
        
        db.collection("analyses").add(analysis_record)

    except HTTPException:
        # Re-raise validation errors (file type, size) without wrapping them
        raise
    except Exception as exc:
        for blob_path in uploaded_blob_paths:
            try:
                bucket.blob(blob_path).delete()
            except Exception as cleanup_exc:
                logger.warning("Failed to clean up uploaded blob '%s': %s", blob_path, cleanup_exc)

        # Catch any unexpected failure in the pipeline and return a clean error
        logger.exception("Prediction pipeline failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")

    return {
        "pneumonia_probability": pneumonia_probability,
        "confidence": confidence,
        "low_confidence": low_confidence,
        "label": label,
        "thresholds": DECISION_THRESHOLDS,
        "image_url": image_url,
        "heatmap_url": heatmap_url
    }



@app.get("/history/{user_id}")
async def get_history(
    user_id: str,
    request: Request,
    authenticated_uid: str = Depends(get_authenticated_uid)
):
    ensure_matching_user(user_id, authenticated_uid)

    # Query Firestore for this specific user's records
    docs = db.collection("analyses").where("user_id", "==", user_id).stream()
    
    history = []
    for doc in docs:
        data = doc.to_dict()
        
        # Decrypt the sensitive data
        decrypted_label = decrypt_data(data["encrypted_diagnosis"])
        raw_score_str = decrypt_data(data["encrypted_confidence"])
        decrypted_patient_id = decrypt_data(data["encrypted_patient_id"]) if data.get("encrypted_patient_id") else "N/A"
        
        try:
            raw_score = float(raw_score_str)
            if NORMAL_MAX_SCORE <= raw_score <= PNEUMONIA_MIN_SCORE:
                derived_conf = max(raw_score, 1.0 - raw_score)
            elif raw_score > PNEUMONIA_MIN_SCORE:
                derived_conf = raw_score
            else:
                derived_conf = 1.0 - raw_score
            derived_conf = round(derived_conf, 4)
        except (ValueError, TypeError):
            raw_score = 0.0
            derived_conf = 0.0
        
        # Generate backend URLs for the images
        fresh_image_url = build_backend_url(request, f"image/{data['image_path']}")
        
        heatmap_url = None
        if "heatmap_path" in data and data["heatmap_path"]:
            heatmap_url = build_backend_url(request, f"image/{data['heatmap_path']}")
        
        low_confidence = data.get("low_confidence")
        if low_confidence is None:
            low_confidence = NORMAL_MAX_SCORE <= raw_score <= PNEUMONIA_MIN_SCORE

        history.append({
            "id": doc.id,
            "date": data["date"],
            "diagnosis": decrypted_label,
            "pneumonia_probability": raw_score,
            "confidence": derived_conf,
            "low_confidence": low_confidence,
            "thresholds": data.get("decision_thresholds", DECISION_THRESHOLDS),
            "patient_id": decrypted_patient_id,
            "image_url": fresh_image_url,
            "heatmap_url": heatmap_url
        })
        
    # Sort history by newest first
    # Firebase stream might not return an ordered list
    history.sort(key=lambda x: x["date"], reverse=True)
    return {"history": history}

@app.get("/image/{file_path:path}")
async def get_image(file_path: str, authenticated_uid: str = Depends(get_authenticated_uid)):
    ensure_file_owner(file_path, authenticated_uid)

    try:
        blob = bucket.blob(file_path)
        if not blob.exists():
            return Response(status_code=404, content="Image not found")
            
        file_contents = blob.download_as_bytes()
        
        # Try to decrypt (for new .enc files)
        try:
            file_contents = decrypt_file(file_contents)
        except Exception:
            # If decryption fails, it's likely an older unencrypted .jpg
            pass
        
        return Response(content=file_contents, media_type="image/jpeg")
    except Exception:
        logger.exception("Error fetching image")
        return Response(status_code=500, content="Error fetching image")

@app.get("/download/{file_path:path}")
async def download_image(file_path: str, authenticated_uid: str = Depends(get_authenticated_uid)):
    """Download endpoint – same as /image/ but forces a file download."""
    ensure_file_owner(file_path, authenticated_uid)

    try:
        blob = bucket.blob(file_path)
        if not blob.exists():
            return Response(status_code=404, content="Image not found")
            
        file_contents = blob.download_as_bytes()
        
        try:
            file_contents = decrypt_file(file_contents)
        except Exception:
            pass
        
        # Build a readable filename from the path
        filename = file_path.split("/")[-1].replace(".enc", ".jpg")
        
        return Response(
            content=file_contents,
            media_type="image/jpeg",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception:
        logger.exception("Error downloading image")
        return Response(status_code=500, content="Error downloading image")
