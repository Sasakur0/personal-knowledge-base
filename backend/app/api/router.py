from fastapi import APIRouter

from .routes.chat import router as chat_router
from .routes.conversations import router as conversations_router
from .routes.documents import router as documents_router
from .routes.health import router as health_router
from .routes.retrieval import router as retrieval_router
from .routes.settings import router as settings_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router, tags=["health"])
api_router.include_router(documents_router, tags=["documents"])
api_router.include_router(conversations_router, tags=["conversations"])
api_router.include_router(retrieval_router, tags=["retrieval"])
api_router.include_router(chat_router, tags=["chat"])
api_router.include_router(settings_router, tags=["settings"])
