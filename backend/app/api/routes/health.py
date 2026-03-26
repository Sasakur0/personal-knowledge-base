from fastapi import APIRouter

from ...models.schemas import HealthResponse
from ...services.health_service import build_health_response
from ...utils.config import get_settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Health check endpoint used by desktop frontend and startup diagnostics."""
    settings = get_settings()
    return build_health_response(settings)
