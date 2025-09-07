from fastapi import FastAPI

app = FastAPI()


# Let's go!
@app.get("/")
def read_root():
    return {"Hello": "World"}
