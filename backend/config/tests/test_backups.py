import importlib.util
import sqlite3
from pathlib import Path


def load(name):
    path=Path(__file__).resolve().parents[3] / 'launcher' / f'{name}.py'
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_backup_uses_writable_data_keeps_fourteen_and_restores(tmp_path):
    launcher=load('launcher')
    launcher.ROOT=tmp_path
    launcher.BACKEND=tmp_path/'bundle'/'backend'
    database=tmp_path/'backend'/'db.sqlite3'
    database.parent.mkdir()
    with sqlite3.connect(database) as connection:
        connection.execute('CREATE TABLE django_migrations (id INTEGER)')
        connection.execute('INSERT INTO django_migrations VALUES (42)')
    for _ in range(16):
        launcher.backup_database(tmp_path/'backups')
    backups=list((tmp_path/'backups').glob('db-*.sqlite3'))
    assert len(backups)==14
    with sqlite3.connect(database) as connection:
        connection.execute('UPDATE django_migrations SET id=99')
    restore=load('restore_backup')
    safety=restore.restore_database(database=database,backup=backups[0])
    with sqlite3.connect(database) as connection:
        assert connection.execute('SELECT id FROM django_migrations').fetchone()[0]==42
    with sqlite3.connect(safety) as connection:
        assert connection.execute('SELECT id FROM django_migrations').fetchone()[0]==99


def test_launcher_finds_standard_x86_edge_and_uses_writable_profile(tmp_path,monkeypatch):
    launcher=load('launcher')
    launcher.ROOT=tmp_path
    browser=tmp_path/'Microsoft/Edge/Application/msedge.exe'
    browser.parent.mkdir(parents=True)
    browser.touch()
    monkeypatch.setenv('PROGRAMFILES(X86)',str(tmp_path))
    command=launcher.browser_command()
    assert command[0]==str(browser)
    assert f'--user-data-dir={tmp_path / "launcher" / "profile"}' in command


def test_source_launcher_uses_production_frontend_mode(tmp_path,monkeypatch):
    launcher=load('launcher')
    launcher.ROOT=tmp_path
    monkeypatch.setattr(launcher.sys,'frozen',False,raising=False)
    for key in ('SMART_POS_DATA_DIR','SMART_POS_FRONTEND_DIR','DJANGO_DEBUG'):
        monkeypatch.setenv(key,'placeholder')
    captured=[]
    monkeypatch.setattr(launcher.subprocess,'run',lambda *args,**kwargs:captured.append(kwargs['env']))
    launcher.run_migrations()
    assert captured[0]['DJANGO_DEBUG']=='0'
