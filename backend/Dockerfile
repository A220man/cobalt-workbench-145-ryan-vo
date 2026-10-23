FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

USER 1000:1000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]