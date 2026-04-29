from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routers import auth, chat, links, stats

app = FastAPI(title="Link Library API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(links.router)
app.include_router(auth.router)
app.include_router(stats.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
