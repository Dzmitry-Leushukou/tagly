FROM python:3.13-slim

WORKDIR /app

COPY utils /app/utils
COPY auth /app/auth

RUN pip install -e /app/utils

COPY auth/requirements.txt /app/auth/requirements.txt
RUN pip install --no-cache-dir -r /app/auth/requirements.txt

CMD ["uvicorn", "auth.main:app", "--host", "0.0.0.0", "--port", "8000"]