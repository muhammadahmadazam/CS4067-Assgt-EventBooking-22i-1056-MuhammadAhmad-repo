FROM python:3.12.9-slim

# user-service/.env
ENV SECRET_KEY=your_secure_secret_key_here
ENV ALGORITHM=HS256
ENV ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV FRONTEND_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/event_booking

WORKDIR /opt/user-service

COPY . .

RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
