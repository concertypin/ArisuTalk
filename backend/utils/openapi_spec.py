import os
import sys
import json

# Add the project root to the sys.path
# Assuming the script is in <project_root>/utils/
script_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(script_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.main import app


def main():
    openapi_spec = app.openapi()
    print(json.dumps(openapi_spec))


if __name__ == "__main__":
    main()
