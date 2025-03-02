from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Setup FastAPI for user-service successfully!"}