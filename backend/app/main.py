from fastapi import FastAPI, File, UploadFile, Form, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import uuid
import datetime

from app.model import model
from app.preprocess import preprocess_image
from app.firebase import db, bucket, encrypt_data, decrypt_data, encrypt_file, decrypt_file
from app.grad_cam import get_gradcam_image, get_target_layer_name

app = FastAPI()

# Allow frontend access (adjust origins later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
    patient_id: str = Form(...)
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    input_tensor = preprocess_image(image)
    prediction = model.predict(input_tensor)

    score = float(prediction[0][0])
    threshold = 0.5

    label = "Pneumonia" if score >= threshold else "Normal"

    # Encrypt Image and Upload to Firebase Storage
    image_filename = f"xrays/{user_id}/{uuid.uuid4()}.enc"
    encrypted_contents = encrypt_file(contents)
    
    blob = bucket.blob(image_filename)
    blob.upload_from_string(encrypted_contents, content_type="application/octet-stream")
    
    # Generate Grad-CAM Heatmap Overlay
    target_layer_name = get_target_layer_name(model)
    heatmap_img = get_gradcam_image(input_tensor, model, target_layer_name)
    
    # Convert heatmap PIL Image to bytes
    heatmap_io = io.BytesIO()
    heatmap_img.save(heatmap_io, format="JPEG")
    heatmap_bytes = heatmap_io.getvalue()
    
    # Encrypt Heatmap Image and Upload
    heatmap_filename = f"heatmaps/{user_id}/{uuid.uuid4()}.enc"
    encrypted_heatmap = encrypt_file(heatmap_bytes)
    
    heatmap_blob = bucket.blob(heatmap_filename)
    heatmap_blob.upload_from_string(encrypted_heatmap, content_type="application/octet-stream")
    
    # Generate backend URLs for the frontend to view the images
    image_url = str(request.base_url) + f"image/{image_filename}"
    heatmap_url = str(request.base_url) + f"image/{heatmap_filename}"

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
        "encrypted_patient_id": encrypted_patient_id
    }
    
    db.collection("analyses").add(analysis_record)

    return {
        "score": round(score, 4),
        "label": label,
        "threshold": threshold,
        "image_url": image_url,
        "heatmap_url": heatmap_url
    }

@app.get("/history/{user_id}")
async def get_history(user_id: str, request: Request):
    # Query Firestore for this specific user's records
    docs = db.collection("analyses").where("user_id", "==", user_id).stream()
    
    history = []
    for doc in docs:
        data = doc.to_dict()
        
        # Decrypt the sensitive data
        decrypted_label = decrypt_data(data["encrypted_diagnosis"])
        decrypted_score = decrypt_data(data["encrypted_confidence"])
        decrypted_patient_id = decrypt_data(data["encrypted_patient_id"]) if data.get("encrypted_patient_id") else "N/A"
        
        # Generate backend URLs for the images
        fresh_image_url = str(request.base_url) + f"image/{data['image_path']}"
        
        heatmap_url = None
        if "heatmap_path" in data and data["heatmap_path"]:
            heatmap_url = str(request.base_url) + f"image/{data['heatmap_path']}"
        
        history.append({
            "id": doc.id,
            "date": data["date"],
            "diagnosis": decrypted_label,
            "confidence": decrypted_score,
            "patient_id": decrypted_patient_id,
            "image_url": fresh_image_url,
            "heatmap_url": heatmap_url
        })
        
    # Sort history by newest first
    # Firebase stream might not return an ordered list
    history.sort(key=lambda x: x["date"], reverse=True)
    return {"history": history}

@app.get("/image/{file_path:path}")
async def get_image(file_path: str):
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
    except Exception as e:
        print(f"Error fetching image: {e}")
        return Response(status_code=500, content="Error fetching image")