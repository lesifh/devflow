from fastapi import FastAPI

app = FastAPI(title="DevFlow API")


@app.get("/")
def read_root():
    return {"message": "Welcome to DevFlow API"}