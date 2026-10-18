"""Stage source code while excluding every writable SQLite file and cache."""
import shutil
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
target = Path(sys.argv[1]).resolve()
if root not in target.parents or target.parent.name != ".release-build":
    raise ValueError("Staging path must be a unique release build directory")
shutil.copytree(root / "backend", target / "backend", ignore=shutil.ignore_patterns("*.sqlite3*", "__pycache__", ".pytest_cache"))
