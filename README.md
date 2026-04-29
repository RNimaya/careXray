# CareXray - Pneumonia Detection System

An AI-powered chest X-ray analysis tool that uses deep learning to detect pneumonia, with Grad-CAM explainability and encrypted data storage.

## Prerequisites

- Python 3.10+
- Node.js & npm
- Firebase project with Firestore and Storage enabled

## Setup

### 1. Backend

```bash
cd backend
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Configure environment variables:**
```bash
cp .env.example .env
```
Then open `.env` and set:

- `ENCRYPTION_KEY`: a stable Fernet key. Generate one with:
  ```bash
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
  ```
- `FIREBASE_STORAGE_BUCKET`: your Firebase Storage bucket name.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: the Firebase Admin SDK service account JSON.

For local development only, you can instead keep `firebase-service-account-key.json` in the `backend/` directory. This file is ignored by Git and should never be committed.

**Run the server:**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will be available at `http://localhost:5173`.

Set `VITE_API_BASE_URL` in `frontend/.env` when the backend is deployed.

## Railway Backend Deployment

Deploy the backend with the Railway root directory set to `backend/`. The included `Procfile` starts FastAPI with Railway's `$PORT`.

Add these Railway variables:

- `ENCRYPTION_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `CORS_ORIGINS` with your deployed frontend URL, for example `https://your-frontend.example.com`

Do not upload or commit `firebase-service-account-key.json`. Paste the service account JSON into Railway's variables instead. Firebase web config values used by the frontend are public client identifiers; protect Firebase with Authentication, Firestore rules, Storage rules, and API key restrictions in Google Cloud.

## Project Structure

```
careXray/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI endpoints & prediction logic
│   │   ├── firebase.py       # Firebase config & encryption utilities
│   │   └── grad_cam.py       # Grad-CAM heatmap generation
│   ├── model/                # Trained TensorFlow model
│   ├── .env.example          # Environment variable template
│   └── requirements.txt      # Python dependencies
└── frontend/                 # React frontend
```
