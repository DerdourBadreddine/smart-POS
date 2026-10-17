from __future__ import annotations

import json
import logging
import os
import socket
import sqlite3
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
CONFIG_PATH = Path(__file__).resolve().parent / "config.json"
LOG_PATH = ROOT / "logs" / "app.log"
URL = "http://127.0.0.1:8000"


def configure_logging() -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        filename=LOG_PATH,
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )


def backup_database(backup_dir: Path) -> None:
    source = BACKEND / "db.sqlite3"
    if not source.exists():
        return
    backup_dir.mkdir(parents=True, exist_ok=True)
    target = backup_dir / f"db-{time.strftime('%Y%m%d-%H%M')}.sqlite3"
    with sqlite3.connect(source) as source_connection, sqlite3.connect(target) as target_connection:
        source_connection.backup(target_connection)
    backups = sorted(backup_dir.glob("db-*.sqlite3"), key=lambda path: path.stat().st_mtime, reverse=True)
    for old_backup in backups[14:]:
        old_backup.unlink()


def run_migrations() -> None:
    env = os.environ.copy()
    env["DJANGO_SETTINGS_MODULE"] = "config.settings"
    subprocess.run([sys.executable, str(BACKEND / "manage.py"), "migrate", "--noinput"], cwd=BACKEND, env=env, check=True)


def start_server():
    from waitress import serve

    sys.path.insert(0, str(BACKEND))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    from config.wsgi import application

    thread = threading.Thread(target=serve, args=(application,), kwargs={"host": "127.0.0.1", "port": 8000}, daemon=True)
    thread.start()
    return thread


def port_in_use() -> bool:
    with socket.socket() as probe:
        return probe.connect_ex(("127.0.0.1", 8000)) == 0


def browser_command() -> list[str] | None:
    candidates = [
        Path(os.environ.get("PROGRAMFILES", "")) / "Microsoft/Edge/Application/msedge.exe",
        Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            profile = Path(__file__).resolve().parent / "profile"
            return [str(candidate), f"--app={URL}", "--window-size=1366,800", f"--user-data-dir={profile}"]
    return None


def main() -> None:
    configure_logging()
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}
        backup_dir = Path(config.get("BACKUP_DIR", ROOT / "backups"))
        if not backup_dir.is_absolute():
            backup_dir = ROOT / backup_dir
        run_migrations()
        backup_database(backup_dir)
        browser = browser_command()
        server_thread = None
        if not port_in_use():
            server_thread = start_server()
        time.sleep(1)
        if browser:
            process = subprocess.Popen(browser, cwd=ROOT)
            process.wait()
        else:
            webbrowser.open(URL)
            while server_thread is None or server_thread.is_alive():
                time.sleep(1)
    except Exception:
        logging.exception("Smart POS launcher failed")
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, f"Smart POS could not start. See {LOG_PATH}", "Smart POS", 0x10)
        except Exception:
            pass
        raise


if __name__ == "__main__":
    main()
