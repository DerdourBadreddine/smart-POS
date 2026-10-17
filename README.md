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
This README will be expanded as each phase is implemented.
