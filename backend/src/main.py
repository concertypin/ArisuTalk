import fastapi
from fastapi import FastAPI
from pydantic import BaseModel

from versions import versions_available

app = FastAPI()


class VersionResponse(BaseModel):
    versions: list[str]


@app.get(
    "/versions",
    tags=["Base"],
    summary="Get available versions",
    responses={404: {"model": VersionResponse}},
)
async def read_versions(
    response: fastapi.Response, version: str | None = None
) -> VersionResponse:
    """
    Get available versions.

    Args:
        versions: available API versions to check.

    Returns:
        A list of available versions.
    """
    response.status_code = 200 if version in versions_available else 404
    return VersionResponse(versions=list(versions_available))


for v in versions_available:
    app.include_router(versions_available[v], prefix=f"/{v}", tags=[v])
