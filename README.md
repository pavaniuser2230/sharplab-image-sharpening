# SharpLab — Image Sharpening Studio

A full-stack Digital Image Processing project for image sharpening using unsharp masking, Laplacian filtering and high-boost filtering.

## Project structure

- frontend/: React + Vite + TypeScript + Tailwind interface.
- backend/: Flask REST API using OpenCV, NumPy and Pillow.
- docs/: project documentation and API notes.

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

## Assumptions

This project assumes a local development setup with a separate frontend and backend service. The frontend communicates with the backend through a Flask REST API, and the Apache/XAMPP deployment path is documented as a reverse-proxy and static-asset setup rather than direct execution of Python in Apache.

## Algorithms

1. Unsharp masking
2. Laplacian filtering
3. High-boost filtering

## Notes

- Guest mode works without authentication.
- Sample images are placeholders and can be replaced with your own licensed assets.
- The processing API validates all inputs on the server before applying operations.
