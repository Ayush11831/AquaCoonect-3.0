# ml-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
# Bind the platform-provided $PORT (Render) and default to 5000 locally.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} api.app:app"]
