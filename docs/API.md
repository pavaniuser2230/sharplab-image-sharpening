# SharpLab API documentation

## Base URL

Development: http://localhost:5000/api

## Endpoints

- GET /health — checks backend availability.
- POST /process — uploads an image and applies a sharpening algorithm.
- GET /download — downloads a generated processed image file.
- GET /metadata — returns supported formats and limits.

## Request example

```bash
curl -X POST http://localhost:5000/api/process \
  -F "file=@sample.jpg" \
  -F "algorithm=unsharp" \
  -F "kernel_size=5" \
  -F "sigma=1.0" \
  -F "amount=1.5"
```

## Response shape

```json
{
  "message": "Processing completed.",
  "algorithm": "unsharp",
  "dimensions": [1200, 800],
  "output_file": "temp/result.png",
  "processing_time_ms": 3.42
}
```
