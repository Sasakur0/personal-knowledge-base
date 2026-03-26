from datetime import UTC, datetime

from ..models.schemas import HealthResponse
from ..utils.config import AppSettings


def build_health_response(settings: AppSettings) -> HealthResponse:
    """Build a health payload used by the health endpoint."""
    return HealthResponse(
        status="ok",
        service="pkb-backend",
        env=settings.app_env,
        timestamp=datetime.now(UTC).isoformat(),
    )
