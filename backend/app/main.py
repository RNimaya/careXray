from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from app.model import model
from app.preprocess import preprocess_image

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
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    input_tensor = preprocess_image(image)
    prediction = model.predict(input_tensor)

    score = float(prediction[0][0])
    threshold = 0.5

    label = "Pneumonia" if score >= threshold else "Normal"

    return {
        "score": round(score, 4),
        "label": label,
        "threshold": threshold
    }