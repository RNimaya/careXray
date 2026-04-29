import base64
import json
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import os

load_dotenv()

DEFAULT_SERVICE_ACCOUNT_PATH = Path(__file__).resolve().parents[1] / "firebase-service-account-key.json"


def get_firebase_credentials():
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    service_account_base64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")

    if service_account_json:
        return credentials.Certificate(json.loads(service_account_json))

    if service_account_base64:
        decoded = base64.b64decode(service_account_base64).decode("utf-8")
        return credentials.Certificate(json.loads(decoded))

    if service_account_path:
        return credentials.Certificate(service_account_path)

    if DEFAULT_SERVICE_ACCOUNT_PATH.exists():
        return credentials.Certificate(str(DEFAULT_SERVICE_ACCOUNT_PATH))

    raise RuntimeError(
        "Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON "
        "or FIREBASE_SERVICE_ACCOUNT_BASE64 in Railway."
    )


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is required.")
    return value


if not firebase_admin._apps:
    firebase_admin.initialize_app(get_firebase_credentials(), {
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "pneumonia-detection-8466e.firebasestorage.app")
    })

db = firestore.client()
bucket = storage.bucket()

ENCRYPTION_KEY = get_required_env("ENCRYPTION_KEY")
cipher_suite = Fernet(ENCRYPTION_KEY)


def verify_id_token(id_token: str) -> dict:
    return auth.verify_id_token(id_token)

def encrypt_data(text: str) -> str:
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_data(text: str) -> str:
    return cipher_suite.decrypt(text.encode()).decode()

def encrypt_file(contents: bytes) -> bytes:
    return cipher_suite.encrypt(contents)

def decrypt_file(contents: bytes) -> bytes:
    return cipher_suite.decrypt(contents)
