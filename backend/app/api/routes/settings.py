from fastapi import APIRouter, HTTPException

from ...models.schemas import (
    AppSettingsResponse,
    ModelListRequest,
    ModelListResponse,
    TestConnectionRequest,
    TestConnectionResponse,
    UpdateAppSettingsRequest,
)
from ...services.settings_service import get_app_settings, get_available_models, test_model_connection, update_app_settings

router = APIRouter(prefix="/settings")


@router.get("", response_model=AppSettingsResponse)
def get_settings() -> AppSettingsResponse:
    """Fetch effective runtime settings."""
    return get_app_settings()


@router.put("", response_model=AppSettingsResponse)
def save_settings(payload: UpdateAppSettingsRequest) -> AppSettingsResponse:
    """Update persisted runtime settings."""
    try:
        return update_app_settings(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/test-connection", response_model=TestConnectionResponse)
def test_settings_connection(payload: TestConnectionRequest) -> TestConnectionResponse:
    """Validate model provider connectivity without persisting changes."""
    return test_model_connection(payload)


@router.post("/models", response_model=ModelListResponse)
def list_provider_models(payload: ModelListRequest) -> ModelListResponse:
    """Fetch model ids from the configured provider."""
    try:
        return get_available_models(payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
