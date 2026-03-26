import os

import uvicorn

from app.main import app


def main() -> None:
    """PyInstaller entrypoint for packaged backend service."""
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
