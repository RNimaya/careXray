import tensorflow as tf

MODEL_PATH = "model/fy_model.h5"

model = tf.keras.models.load_model(MODEL_PATH)