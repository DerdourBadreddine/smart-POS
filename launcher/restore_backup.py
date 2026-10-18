from __future__ import annotations
import argparse
import json
import sqlite3
import time
import sys
from contextlib import closing
from pathlib import Path


def select_backup(directory: Path) -> Path | None:
    import ctypes
    from ctypes import wintypes

    class OpenFileName(ctypes.Structure):
        _fields_ = [("size", wintypes.DWORD), ("owner", wintypes.HWND), ("instance", wintypes.HINSTANCE),
                    ("filter", wintypes.LPCWSTR), ("custom_filter", wintypes.LPWSTR), ("max_custom", wintypes.DWORD),
                    ("filter_index", wintypes.DWORD), ("file", wintypes.LPWSTR), ("max_file", wintypes.DWORD),
                    ("file_title", wintypes.LPWSTR), ("max_title", wintypes.DWORD), ("initial_dir", wintypes.LPCWSTR),
                    ("title", wintypes.LPCWSTR), ("flags", wintypes.DWORD), ("file_offset", wintypes.WORD),
                    ("extension_offset", wintypes.WORD), ("extension", wintypes.LPCWSTR), ("custom_data", wintypes.LPARAM),
                    ("hook", ctypes.c_void_p), ("template", wintypes.LPCWSTR), ("reserved", ctypes.c_void_p),
                    ("reserved2", wintypes.DWORD), ("flags_ex", wintypes.DWORD)]
    buffer = ctypes.create_unicode_buffer(32768)
    dialog = OpenFileName()
    dialog.size = ctypes.sizeof(dialog)
    dialog.filter = "SQLite backups\0*.sqlite3\0\0"
    dialog.file = ctypes.cast(buffer, wintypes.LPWSTR)
    dialog.max_file = len(buffer)
    dialog.initial_dir = str(directory)
    dialog.title = "Sauvegarde / النسخة الاحتياطية"
    dialog.flags = 0x1000 | 0x800 | 0x8
    return Path(buffer.value) if ctypes.windll.comdlg32.GetOpenFileNameW(ctypes.byref(dialog)) else None


def restore_database(*, database: Path, backup: Path) -> Path | None:
    """Validate first, retain a unique safety copy, then restore via SQLite backup."""
    if not backup.is_file() or backup.resolve() == database.resolve():
        raise ValueError("Invalid backup / Sauvegarde invalide")
    with closing(sqlite3.connect(f"{backup.as_uri()}?mode=ro", uri=True)) as source:
        if source.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("Backup integrity check failed")
        if not source.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='django_migrations'").fetchone():
            raise ValueError("Not a Smart POS database")
        database.parent.mkdir(parents=True, exist_ok=True)
        safety = None
        if database.exists():
            safety = database.with_name(f"db-before-restore-{time.time_ns()}.sqlite3")
            with closing(sqlite3.connect(database)) as current, closing(sqlite3.connect(safety)) as destination:
                current.backup(destination)
        with closing(sqlite3.connect(database)) as destination:
            source.backup(destination)
    return safety


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--backup", type=Path)
    args = parser.parse_args()
    root = args.data_dir.resolve()
    config_file = root / "config.json"
    if not config_file.exists():
        config_file = root / "launcher" / "config.json"
    config = json.loads(config_file.read_text(encoding="utf-8")) if config_file.exists() else {}
    directory = Path(config.get("BACKUP_DIR", root / "backups"))
    if not directory.is_absolute():
        directory = root / directory
    if args.backup:
        backup = args.backup.resolve()
    elif getattr(sys, "frozen", False):
        import ctypes
        backup = select_backup(directory)
        if backup is None or ctypes.windll.user32.MessageBoxW(0, "Fermez Smart POS avant de continuer. Restaurer ?\nأغلق البرنامج قبل المتابعة. هل تريد الاسترجاع؟", "Smart POS", 0x4 | 0x20) != 6:
            return
    else:
        backups = sorted(directory.glob("db-*.sqlite3"), reverse=True)
        for index, backup in enumerate(backups, 1):
            print(index, backup.name)
        selection = int(input("Fermez Smart POS. Numéro de sauvegarde / أغلق البرنامج ثم اختر رقم النسخة: "))
        if selection < 1 or selection > len(backups):
            raise ValueError("Invalid selection")
        backup = backups[selection - 1]
    safety = restore_database(database=root / "backend" / "db.sqlite3", backup=backup)
    if getattr(sys, "frozen", False):
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, f"Restauration terminée / تم الاسترجاع\n{safety}", "Smart POS", 0x40)
    else:
        print("Restauration terminee. Safety copy:", safety)


if __name__ == "__main__":
    main()
