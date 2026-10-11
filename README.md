# SharpLab — Image Sharpening Studio

**Digital Image Processing Major Project**

**Project Title:** Unsharp Masking and High-Boost Filtering for Image Sharpening  
**Author:** G. Pavani  
**Enrollment Number:** 24CS003379  
**Programme:** B.Tech CSE (AI & ML)

---

## 1. Project Overview

SharpLab is a browser-based image-sharpening application designed to demonstrate three classical image-processing techniques: Unsharp Masking, Laplacian Filtering, and High-Boost Filtering.

The application provides an interactive workspace where users can upload images, select sharpening algorithms, adjust processing parameters, compare original and processed images, inspect available image information, and download processed results.

SharpLab aims to make image sharpening easier to understand, experiment with, and evaluate through a simple user interface.

## 2. Problem Statement

Images may appear soft or blurred when edges and fine details are not clearly defined. Image sharpening can improve perceived detail, but excessive processing may amplify noise, create halos, and produce unnatural edges.

A useful image-sharpening tool should provide multiple algorithms, adjustable parameters, and a convenient way to compare processed images with their originals.

SharpLab addresses this problem by bringing multiple sharpening techniques into one interactive application.

## 3. Project Objectives

- Implement three classical image-sharpening techniques.
- Provide an easy image-upload and processing workflow.
- Allow users to adjust algorithm-specific parameters.
- Display original and processed images for comparison.
- Show available image dimensions and metadata.
- Provide a processed-image download option.
- Create a user-friendly interface for learning and experimenting with image-processing techniques.

## 4. Features

- Interactive browser-based workspace.
- Image upload support for PNG, JPG, JPEG, and WebP formats.
- Three sharpening algorithms:
  - Unsharp Masking
  - Laplacian Filtering
  - High-Boost Filtering
- Adjustable kernel size, blur strength, sharpening amount, and algorithm-specific parameters.
- Soft, Balanced, and Strong presets displayed in the interface.
- Original-versus-processed image comparison.
- Image dimensions and available metadata display.
- Processed-image download workflow.
- Guest-oriented access without a mandatory account.

Feature availability depends on correct frontend and backend configuration.

## 5. Image-Sharpening Algorithms

### 5.1 Unsharp Masking

Unsharp Masking creates a blurred version of the input image, subtracts it from the original to isolate high-frequency details, and adds a scaled detail mask back to the original image.

Formula:

g(x,y) = f(x,y) + k[f(x,y) - f̄(x,y)]

Where:

- f(x,y) represents the input image.
- f̄(x,y) represents the blurred image.
- k controls sharpening strength.
- g(x,y) represents the sharpened output.

This method can enhance fine details and edge contrast. Excessive sharpening may introduce halos or amplify noise.

### 5.2 Laplacian Filtering

Laplacian Filtering uses a second-order spatial derivative to emphasize rapid intensity changes and image edges.

Formula:

g(x,y) = f(x,y) - c∇²f(x,y)

Where:

- f(x,y) is the input image.
- ∇²f(x,y) is the Laplacian response.
- c controls the contribution of the Laplacian response.
- g(x,y) is the output image.

The exact output depends on the selected kernel and sign convention.

### 5.3 High-Boost Filtering

High-Boost Filtering combines a scaled version of the original image with a blurred-image subtraction.

Formula:

g(x,y) = Af(x,y) - f̄(x,y)

An equivalent form for A > 1 is:

g(x,y) = f(x,y) + (A - 1)[f(x,y) - f̄(x,y)]

Where:

- A represents the high-boost factor.
- f(x,y) is the original image.
- f̄(x,y) is the blurred image.
- g(x,y) is the sharpened output.

The high-boost factor controls the contribution of the original image to the result.

## 6. Technology Stack

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS

Backend:
- Python
- Flask

Image Processing:
- Pillow
- NumPy
- OpenCV-compatible filtering operations, where used by the implementation

Version Control:
- Git
- GitHub

Intended Deployment:
- Vercel for the frontend
- Render for the backend API

Refer to the project's dependency files for the exact package versions.

## 7. System Architecture

SharpLab uses a frontend-backend architecture.

1. The user uploads an image through the web interface.
2. The frontend collects the selected algorithm and parameter values.
3. The Flask API receives the processing request.
4. The backend validates the request and processes the image.
5. The processed image and available information are returned.
6. The frontend displays the original and processed images.
7. The user can download the processed output when the download endpoint is available.

Architecture Flow:

User
→ React + Vite Frontend
→ Flask REST API
→ Image Processing Operations
→ Processed Image and Metadata
→ Comparison and Download

## 8. Project Structure

The repository separates frontend and backend components.

sharplab-image-sharpening/
|
|-- frontend/
|   |-- React, Vite, and TypeScript interface
|
|-- backend/
|   |-- Flask API
|   |-- app/
|       |-- routes/
|           |-- api.py
|
|-- README.md
|-- Other dependency and configuration files

The actual repository may contain additional files. Use the current repository structure as the authoritative reference.

## 9. Requirements

- Python compatible with the backend dependency files.
- Node.js and npm compatible with the frontend project.
- Git for cloning the repository.
- A modern web browser.
- Network access to install dependencies, unless already installed.

## 10. Installation and Setup

### Step 1: Clone the Repository

git clone https://github.com/pavaniuser2230/sharplab-image-sharpening.git

cd sharplab-image-sharpening

### Step 2: Set Up the Backend

Open a terminal and navigate to the backend directory:

cd backend

Create a virtual environment:

python -m venv .venv

For Windows PowerShell, activate it using:

.\.venv\Scripts\Activate.ps1

For macOS or Linux, use:

source .venv/bin/activate

If the backend contains a requirements.txt file, install dependencies:

python -m pip install -r requirements.txt

Start the Flask application using the entry point configured in the repository. For example, if app.py is the configured entry point:

python app.py

The actual entry point and port must match the current backend configuration.

### Step 3: Set Up the Frontend

Open another terminal:

cd frontend

Install dependencies:

npm install

If the frontend uses the VITE_API_BASE_URL environment variable, create a .env file in the frontend directory:

VITE_API_BASE_URL=http://127.0.0.1:5000

Use the actual address and port configured by your backend.

Start the frontend:

npm run dev

Open the local URL displayed by Vite in your browser# SharpLab — Image Sharpening Studio

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
