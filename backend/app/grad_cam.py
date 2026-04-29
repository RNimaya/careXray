# ─────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────
import os
import sys
import logging
import matplotlib
matplotlib.use("Agg")          # non-interactive backend (saves to file)
import matplotlib.pyplot as plt
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# STEP 0 & 1: GET THE LAYER BEFORE GAP
# ─────────────────────────────────────────
def get_target_layer_name(model):
    # Find last Conv2D layer in the base DenseNet
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    raise ValueError("No Conv2D found")


# ─────────────────────────────────────────
# STEP 2: GRAD-CAM HEATMAP FUNCTION
# ─────────────────────────────────────────
def make_gradcam_heatmap(img_array, model, target_layer_name, pred_score=None):
    # model.output may be a list (e.g. [KerasTensor]); unwrap if needed
    model_output = model.output[0] if isinstance(model.output, list) else model.output

    grad_model = Model(
        inputs=model.input,
        outputs=[
            model.get_layer(target_layer_name).output,  # spatial feature maps
            model_output                                 # final prediction
        ]
    )

    with tf.GradientTape() as tape:
        inputs = tf.cast(img_array, tf.float32)
        conv_outputs, predictions = grad_model(inputs)
        
        # If predicting Normal (< 0.5), we compute gradients for the Normal class (1.0 - prob)
        # Otherwise, we compute gradients for Pneumonia (prob)
        if pred_score is not None and pred_score < 0.5:
            class_channel = 1.0 - predictions[:, 0]
        else:
            class_channel = predictions[:, 0]

    grads = tape.gradient(class_channel, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)

    return heatmap.numpy()

# ─────────────────────────────────────────
# STEP 3: OVERLAY FUNCTION
# ─────────────────────────────────────────
def overlay_gradcam(original_img, heatmap, intensity_scale=1.0, alpha=0.5, pred_score=None):
    """
    original_img: numpy array (224, 224, 3), pixel values 0-1
    heatmap: raw heatmap from Grad-CAM
    intensity_scale: factor to scale heatmap brightness (e.g. prediction score)
    pred_score: original prediction score (0.0 to 1.0) used for colormap selection
    """
    img_uint8 = np.uint8(original_img * 255)

    # 1. Resize heatmap to image size
    heatmap_resized = cv2.resize(heatmap, (224, 224))

    # 2. Smooth the heatmap to remove 'random spots' (raw noise)
    heatmap_resized = cv2.GaussianBlur(heatmap_resized, (15, 15), 0)

    # NEW: 2.5 Spatial Masking to suppress artifacts on shoulders, arms, or neck
    # We create a generic lung bounding region and softly blur its edges.
    # Lungs typically fall within 10%-90% vertical and 15%-85% horizontal space.
    spatial_mask = np.zeros((224, 224))
    spatial_mask[22:201, 33:190] = 1.0
    spatial_mask = cv2.GaussianBlur(spatial_mask, (61, 61), 0)
    
    # Restrict heatmap to the central lung cavity
    heatmap_resized = heatmap_resized * spatial_mask

    # 3. Scale by intensity (e.g., if pred is 0.1, heatmap becomes very faint)
    heatmap_resized = heatmap_resized * intensity_scale

    # 4. Threshold: zero-out weak activations (refined to 0.2 for cleaner signal)
    heatmap_resized = np.where(heatmap_resized < 0.2, 0, heatmap_resized)

    # Normalize to 0-255 for color mapping
    heatmap_uint8 = np.uint8(255 * heatmap_resized)

    # 5. Colormap Selection: Green/Blue for Normal, Red/Yellow for Pneumonia
    if pred_score is not None and pred_score < 0.5:
        # cv2.COLORMAP_WINTER goes from Blue (low) to Green (high)
        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_WINTER)
    else:
        # cv2.COLORMAP_JET goes from Blue (low) to Red (high)
        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        
    colored_heatmap = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)

    # Per-pixel alpha: blend strength proportional to filtered heatmap intensity
    pixel_alpha = (heatmap_resized[..., np.newaxis] * alpha)
    overlay = np.uint8(colored_heatmap * pixel_alpha + img_uint8 * (1 - pixel_alpha))

    return img_uint8, heatmap_resized, overlay

def get_gradcam_image(img_input, model, target_layer_name, pred_score=1.0):
    """
    img_input: preprocessed image tensor (1, 224, 224, 3)
    pred_score: The model's pneumonia probability (0 to 1)
    """
    heatmap = make_gradcam_heatmap(img_input, model, target_layer_name, pred_score=pred_score)
    
    # We want the heatmap intensity to match the model's confidence in its prediction
    confidence = pred_score if pred_score > 0.5 else 1.0 - pred_score
    _, _, overlay = overlay_gradcam(img_input[0], heatmap, intensity_scale=confidence, pred_score=pred_score)
    
    from PIL import Image
    return Image.fromarray(overlay)


# ─────────────────────────────────────────
# STEP 4: VISUALIZE SINGLE IMAGE
# ─────────────────────────────────────────
def run_gradcam_single(img_path, model, target_layer_name):
    # Load & preprocess
    img = tf.keras.preprocessing.image.load_img(img_path, target_size=(224, 224))
    img_array = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    img_input = np.expand_dims(img_array, axis=0)

    # Predict
    pred_prob = model.predict(img_input, verbose=0)[0][0]
    pred_class = "Pneumonia" if pred_prob > 0.5 else "Normal"
    confidence = pred_prob if pred_prob > 0.5 else 1 - pred_prob

    # Grad-CAM
    heatmap = make_gradcam_heatmap(img_input, model, target_layer_name, pred_score=pred_prob)
    original, heatmap_img, overlay = overlay_gradcam(img_array, heatmap, intensity_scale=confidence, pred_score=pred_prob)

    # Plot — overlay only
    fig, ax = plt.subplots(1, 1, figsize=(6, 6))
    ax.imshow(overlay)
    ax.axis("off")

    plt.tight_layout()

    output_path = os.path.join(SCRIPT_DIR, "gradcam_single.png")
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    logger.info("Saved Grad-CAM visualization to: %s", output_path)
    logger.info("Prediction: %s | Confidence: %.2f%%", pred_class, confidence * 100)

# ─────────────────────────────────────────
# STEP 5: VISUALIZE BATCH FROM GENERATOR
# ─────────────────────────────────────────
def run_gradcam_batch(model, generator, target_layer_name, num_images=6):
    generator.reset()
    images, labels = next(generator)
    images = images[:num_images]
    labels = labels[:num_images]

    fig, axes = plt.subplots(num_images, 3, figsize=(12, 4 * num_images))
    fig.suptitle("Grad-CAM Visualizations", fontsize=16, fontweight="bold")

    for i in range(num_images):
        img_array = np.expand_dims(images[i], axis=0)

        # Predict
        pred_prob = model.predict(img_array, verbose=0)[0][0]
        pred_class = "Pneumonia" if pred_prob > 0.5 else "Normal"
        true_class = "Pneumonia" if labels[i] == 1 else "Normal"
        confidence = pred_prob if pred_prob > 0.5 else 1 - pred_prob

        # Grad-CAM
        heatmap = make_gradcam_heatmap(img_array, model, target_layer_name, pred_score=pred_prob)
        original, heatmap_img, overlay = overlay_gradcam(images[i], heatmap, intensity_scale=confidence, pred_score=pred_prob)

        # Correct / Wrong label
        result = "✓" if pred_class == true_class else "✗"

        axes[i][0].imshow(original)
        axes[i][0].set_title(f"True: {true_class}", fontsize=11)
        axes[i][0].axis("off")

        axes[i][1].imshow(heatmap_img, cmap="jet")
        axes[i][1].set_title("Heatmap", fontsize=11)
        axes[i][1].axis("off")

        axes[i][2].imshow(overlay)
        axes[i][2].set_title(f"{result} Pred: {pred_class} ({confidence:.2%})", fontsize=11)
        axes[i][2].axis("off")

    plt.tight_layout()

    output_path = os.path.join(SCRIPT_DIR, "gradcam_batch.png")
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    logger.info("Saved batch Grad-CAM visualization to: %s", output_path)

# ─────────────────────────────────────────
# RUN IT
# ─────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Resolve paths relative to *this* file so the script works
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(SCRIPT_DIR, "..", "model", "fy_model.h5")

    logger.info("Loading model from: %s", MODEL_PATH)
    denseNet121_model = tf.keras.models.load_model(MODEL_PATH)
    logger.info("Model loaded successfully!")

    target_layer_name = get_target_layer_name(denseNet121_model)
    logger.info("Using layer: %s", target_layer_name)

    # Single image Grad-CAM
    run_gradcam_single(
        img_path="/Users/nimayaekanayake/Desktop/Final Year Project/img/consolidation-rml.jpg",
        model=denseNet121_model,
        target_layer_name=target_layer_name
    )
