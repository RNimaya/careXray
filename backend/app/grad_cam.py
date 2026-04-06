# ─────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────
import os
import sys
import matplotlib
matplotlib.use("Agg")          # non-interactive backend (saves to file)
import matplotlib.pyplot as plt
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model

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
def make_gradcam_heatmap(img_array, model, target_layer_name):
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
        class_channel = predictions[:, 0]  # binary → single output neuron

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
def overlay_gradcam(original_img, heatmap, alpha=0.4):
    """
    original_img: numpy array (224, 224, 3), pixel values 0-1 (from generator)
    """
    img_uint8 = np.uint8(original_img * 255)

    heatmap_resized = cv2.resize(heatmap, (224, 224))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)

    colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    colored_heatmap = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)

    overlay = np.uint8(colored_heatmap * alpha + img_uint8 * (1 - alpha))

    return img_uint8, heatmap_resized, overlay

def get_gradcam_image(img_input, model, target_layer_name):
    """
    img_input: preprocessed image tensor of shape (1, 224, 224, 3)
    Returns: A PIL Image containing just the Grad-CAM overlay
    """
    heatmap = make_gradcam_heatmap(img_input, model, target_layer_name)
    _, _, overlay = overlay_gradcam(img_input[0], heatmap)
    
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
    heatmap = make_gradcam_heatmap(img_input, model, target_layer_name)
    original, heatmap_img, overlay = overlay_gradcam(img_array, heatmap)

    # Plot — overlay only
    fig, ax = plt.subplots(1, 1, figsize=(6, 6))
    ax.imshow(overlay)
    ax.axis("off")

    plt.tight_layout()

    output_path = os.path.join(SCRIPT_DIR, "gradcam_single.png")
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"Saved Grad-CAM visualization to: {output_path}")
    print(f"Prediction: {pred_class} | Confidence: {confidence:.2%}")

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
        heatmap = make_gradcam_heatmap(img_array, model, target_layer_name)
        original, heatmap_img, overlay = overlay_gradcam(images[i], heatmap)

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
    print(f"Saved batch Grad-CAM visualization to: {output_path}")

# ─────────────────────────────────────────
# RUN IT
# ─────────────────────────────────────────
if __name__ == "__main__":
    # Resolve paths relative to *this* file so the script works
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(SCRIPT_DIR, "..", "model", "fy_model.h5")

    print(f"Loading model from: {MODEL_PATH}")
    denseNet121_model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully!")

    target_layer_name = get_target_layer_name(denseNet121_model)
    print(f"Using layer: {target_layer_name}")

    # Single image Grad-CAM
    run_gradcam_single(
        img_path="/Users/nimayaekanayake/Desktop/Final Year Project/img/consolidation-rml.jpg",
        model=denseNet121_model,
        target_layer_name=target_layer_name
    )
