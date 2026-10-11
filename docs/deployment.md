# Apache / XAMPP deployment guidance

This project is designed to run as a split application:

- Frontend: React build served as static files by Apache or a static host.
- Backend: Flask API runs separately on a local port such as 5000.

## Recommended production pattern

1. Build the frontend with `npm run build`.
2. Publish the generated `dist` folder to Apache's web root or a static host.
3. Configure Apache to proxy `/api` traffic to the Flask app at `http://127.0.0.1:5000`.
4. Use HTTPS in production and configure secure cookies if authentication is enabled.

## Example reverse proxy

```apache
ProxyPass /api http://127.0.0.1:5000/api
ProxyPassReverse /api http://127.0.0.1:5000/api
```

Do not assume XAMPP itself executes Python code. It should serve the frontend and proxy API requests to the Flask backend.
