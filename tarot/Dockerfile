FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY requirements.txt requirements-full.txt ./
RUN pip install --no-cache-dir -r requirements-full.txt

COPY . .

# the SQLite file lives on a volume, not in the image layer
RUN mkdir -p /data
ENV READINGS_DB=/data/readings.db

EXPOSE 5000
# Threads rather than extra workers: the interpretation endpoint holds a
# connection open while it streams, so the server needs concurrency, not CPU.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "8", \
     "--timeout", "120", "app:app"]
