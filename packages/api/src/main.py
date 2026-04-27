from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import auth, links

app = FastAPI(title="Link Library API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(links.router)
app.include_router(auth.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
