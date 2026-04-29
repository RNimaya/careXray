import numpy as np
from PIL import Image

IMG_SIZE = (224, 224)  # change to  model’s input size

def preprocess_image(image: Image.Image):
    image = image.convert("RGB")
    image = image.resize(IMG_SIZE, resample=Image.LANCZOS)  # better downsampling quality

    img_array = np.array(image, dtype=np.float32) / 255.0  # explicit float32 prevents TF type warnings
    img_array = np.expand_dims(img_array, axis=0)


    return img_array