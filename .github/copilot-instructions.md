# Smart POS: Copilot Instructions

## Project
A local, single-user desktop-style app for a mobile phone shop. It sells phones, accessories and repair parts, and offers repair services. Features: Point of Sale, Inventory (phones tracked by IMEI), Repair Tickets, Dashboard (today's sales, pending repairs, low stock), Customers with credit balances (dette), Warranty and IMEI device lookup, Expenses with an end-of-day report, CSV import/export, Shop settings. The UI is bilingual: French and Arabic (right-to-left).
Runs on one Windows laptop. No internet dependency, no user accounts, no multi-tenancy.

## Stack
- Backend: Python 3.12, Django 5.2 LTS, Django REST Framework, django-filter, WhiteNoise, Waitress. Database: SQLite.
- Frontend: Angular (latest stable) with standalone components, signals, and the new control flow (@if, @for). UI: Angular Material (Material 3 theme). i18n: Transloco (@jsverse/transloco) with runtime language switching, languages fr and ar. No NgModules.
- Production: Django serves the built Angular app at / and the API at /api/. One process on 127.0.0.1:8000.
- Development: `python manage.py runserver` (port 8000) and `ng serve` (port 4200) with a proxy.conf.json forwarding /api to 8000.

## Repository layout
- backend/ : Django project `config/` plus apps `catalog`, `inventory`, `customers`, `sales`, `repairs`, `shop` (ShopSettings, Expense), `dashboard` (summary and end-of-day report).
- frontend/ : Angular workspace. src/app/core (api services, models, interceptors), src/app/layout (shell, sidenav), src/app/features/<feature> (inventory, pos, repairs, dashboard, customers, devices, expenses, reports, settings), src/app/shared (reusable components, pipes).
- launcher/ : launcher.py, install.bat, create_shortcut.ps1.

## Backend rules
- One app per domain. Each app has models.py, serializers.py, views.py, urls.py, services.py, tests/.
- Business logic (stock changes, checkout, voiding, repair status rules, numbering) lives ONLY in services.py functions wrapped in `transaction.atomic`. Views and serializers call services; they never contain stock or money logic.
- Money fields: DecimalField(max_digits=10, decimal_places=2). Never use float for money. Use Decimal in all calculations.
- Every stock change must create a StockMovement row. Never edit Product.stock_qty directly outside services.
- Snapshot price, cost and description on SaleItem and RepairPart; never recompute history from the current Product.
- Use DRF ModelViewSet + DefaultRouter, PageNumberPagination (page size 25), SearchFilter and DjangoFilterBackend. Custom actions via @action. Return clear 400 errors as {"detail": "..."} or field errors.
- No authentication: permission classes AllowAny. The server only binds to 127.0.0.1. Do not add JWT, OAuth, sessions or user models.
- CORS only in development (django-cors-headers, allow http://localhost:4200). Production is same-origin.
- SQLite: keep migrations in git, enable WAL mode, one writer, no raw SQL unless needed.
- User-facing messages: wrap every validation or error message in gettext / gettext_lazy. LocaleMiddleware is enabled with LANGUAGES fr and ar; keep locale/fr and locale/ar .po files up to date (makemessages, compilemessages). Return codes (status, reason, method) as stable English codes; the frontend translates them.
- Credit sales: Sale.amount_paid may be below total only when a customer is set. Later payments are SalePayment rows; balance = total - amount_paid - sum(payments).
- Tests: pytest-django or Django TestCase. Every function in services.py needs tests for the happy path and the main failure cases (out of stock, duplicate IMEI, void twice).
- Style: type hints, small functions, docstrings only where behavior is not obvious, black-compatible formatting.

## Frontend rules
- Standalone components with `ChangeDetectionStrategy.OnPush`; use signals (signal, computed, effect) for state; use `inject()` instead of constructor injection.
- One typed data service per API resource in core/api (e.g. ProductsApi) using HttpClient. TypeScript interfaces in core/models mirror the DRF serializers exactly. Never use `any`.
- Base URL is relative (`/api/`) so it works in dev (proxy) and production (same origin).
- Forms: typed reactive forms. Show validation errors under each field.
- UI: Angular Material components only (table, paginator, sort, dialog, snackbar, select, datepicker, chips, tabs, sidenav, toolbar). Keep a clean, modern, spacious look: neutral surfaces, one primary color, consistent 8px spacing, rounded cards, clear empty states and loading states.
- POS screen must be keyboard-first: autofocus the search/scan input, Enter adds the item, barcode/IMEI scanner input works as plain typing, and F-keys or clear buttons for pay/cancel.
- Lazy-load feature routes with loadComponent where practical.

## Workflow
- Work one phase at a time. Do not start the next phase until the human says next.
- Before writing code, state which files you will create or change. After writing, list the exact commands to run and how to verify.
- Keep the app working. Backend tests pass and the frontend builds before you say a phase is done.
