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
HTTP error/language interceptors.
