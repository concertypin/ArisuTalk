"""
This module imports and aggregates all versioned routers for the API.
Each versioned router should be defined in its own module (e.g., v1, v2, etc.).
"""

from .v1.main import router as v1_router

"""
Make sure to import all versioned routers here.
Name should be in the format: v{version_number}_router.
"""
versions_available = {
    "v1": v1_router,
}


__all__ = [
    "v1_router",
]
