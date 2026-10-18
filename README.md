# Smart POS
Local desktop-style POS for a mobile phone shop on one Windows laptop.
One Django process serves the REST API and the built Angular app on 127.0.0.1:8000.
The backend stores data in a single SQLite file and uses Django REST Framework.
The frontend is Angular with Material, standalone components, and bilingual French/Arabic UI.
Planned modules: catalog, inventory, customers, sales, repairs, shop settings, and dashboard.
Development backend command: `python manage.py runserver` from `backend/`.
Development frontend command: `ng serve` from `frontend/` with `/api` proxying to the backend.
Production will run Django plus Waitress and serve the Angular build from the same origin.
The launcher folder will hold the Windows startup script and desktop shortcut tooling.
## Current status

The Django backend foundation and REST API are implemented, including:

- catalog, inventory, customer, sales, repairs, shop, dashboard, and device lookup domains;
- transactional stock receiving, adjustments, checkout, voiding, repair parts, and payments;
- CSV catalog import/export and shop settings;
- customer statements, IMEI history/warranty lookup, expenses, and end-of-day reporting;
- demo data seeding and automated backend tests.

## Backend setup

From `backend/`:

```powershell
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

Run the backend tests with:

```powershell
pytest
```

## Frontend setup

From `frontend/`:

```powershell
npm install
npm start
```

The development server runs on port 4200 and proxies `/api` to Django on port
8000. Build the production frontend with:

```powershell
npm run build
```

The build output is written to `frontend_dist/`, ready for Django to serve.
The current shell includes bilingual French/Arabic navigation, runtime RTL
switching, local fonts, Transloco translations, typed API services, and shared
HTTP error/language interceptors. Phases 5 and 6 add keyboard-first POS
checkout, repair workflows, customer credit payments, printable receipts,
sales history, shop settings, expenses, reports, and device warranty lookup.
Phase 7 adds the dashboard, production Django serving, Windows launcher,
backups, installer tooling, and the bilingual owner guide.

## Optional Windows executable

After building the frontend, run this from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File launcher\build_exe.ps1
```

The one-folder output is `dist\SmartPOS\SmartPOS.exe`. Keep the database,
backups, and logs beside the packaged application. The build script installs
PyInstaller and Pillow if they are not already available, includes Django,
DRF, django-filter, Waitress, the frontend, and static files, and uses a
windowed entry point.

For a client-ready folder that requires no Python or Node.js, run:

```powershell
powershell -ExecutionPolicy Bypass -File launcher\build_client_package.ps1
```

Give the client the generated `release\SmartPOS-Client` folder. The client only
double-clicks `SmartPOS.exe`; `backend\db.sqlite3`, `backups`, and `logs` are
created beside it and are not part of the bundled application code.

## Redesign validation

The rebuild is on branch `redesign`. See `docs/ARCHITECTURE.md`, `docs/AUDIT.md`,
`docs/PLAN.md` and `docs/REPORT.md` for findings, decisions and actual verification.
Baseline and updated bilingual screenshots are in `docs/screenshots/`.

Run backend checks from `backend`: `python -m pytest` and `python manage.py check`.
Run frontend checks from `frontend`: `npm run build -- --configuration production`,
`npm run check:i18n`, and `npm run e2e`. Playwright requires Chromium:
`npx playwright install chromium`.

**Browser tests create transactions. Always use a copied database.** Set
`SMART_POS_DATA_DIR` to an isolated folder containing `backend/db.sqlite3`,
`SMART_POS_FRONTEND_DIR` to the absolute `frontend_dist` path, and `DJANGO_DEBUG=0`.
Run `python backend/manage.py runserver 127.0.0.1:8765 --noreload` from the root.
Playwright defaults to this port; `BASE_URL` overrides it for packaged tests.

Packaging uses a unique `.release-build/` staging folder and excludes SQLite
data from bundled backend source. The client builder refreshes application
files in `release/SmartPOS-Client` while retaining its database, backups, logs
and configuration. It does not replace the original running SmartPOS-Client.
Close a release before refreshing that same release folder.

The forward repair migration adds a description snapshot and backfills existing
parts from their product names. Later catalog renames preserve that repair history.
Previously lost historical names cannot be reconstructed. Startup applies the
migration automatically; acceptance tests exercise it only on copied databases.

`SmartPOS.exe --serve-only` starts the packaged server without a browser for
smoke tests; `SMART_POS_PORT` selects an isolated port (default remains 8000).
The packaged restore tool is `launcher/restore_backup.bat`; it uses the native
Windows file picker and creates a uniquely named safety copy before restoring.
