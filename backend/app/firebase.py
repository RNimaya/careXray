import firebase_admin
from firebase_admin import credentials, firestore, storage
from cryptography.fernet import Fernet
import os

# 1. Initialize Firebase Admin
# Replace 'firebase-service-account-key.json' with your actual key file path
cred = credentials.Certificate("firebase-service-account-key.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'pneumonia-detection-8466e.firebasestorage.app'  # Replace with your storage bucket
})

db = firestore.client()
bucket = storage.bucket()

# 2. Setup Encryption
# The encryption key should ideally be stored securely in environment variables.
# Generate a new key and save it externally for production.
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_data(text: str) -> str:
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_data(text: str) -> str:
    return cipher_suite.decrypt(text.encode()).decode()

def encrypt_file(contents: bytes) -> bytes:
    return cipher_suite.encrypt(contents)

def decrypt_file(contents: bytes) -> bytes:
    return cipher_suite.decrypt(contents)
