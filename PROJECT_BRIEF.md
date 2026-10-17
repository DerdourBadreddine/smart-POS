# Smart POS: Project Brief for GitHub Copilot

> Single source of truth for this project. Copilot: read this whole file before doing anything.

---

## 0. For the human (3 steps)

1. Create a new folder (for example `smart-pos`), put this file inside it, and open the folder in VS Code.
2. Open Copilot Chat, switch to **Agent mode**, attach this file (type `#file:PROJECT_BRIEF.md`) and paste this kickoff prompt:

   ```text
   Read #file:PROJECT_BRIEF.md completely. Follow section 1 (How you must work). Do Step 0 first, then Phase 1 only. When the phase is done, show me the commands to run and the Check list, update the progress tracker in section 9, and stop. Wait until I say "next" before starting the next phase.
   ```

3. After each phase: run the Check list yourself, commit to Git, then type `next` (or start a fresh chat, attach this file again and say "continue with the next unchecked phase in section 9").

Prerequisites on your machine: VS Code with GitHub Copilot, Git, Python 3.12, Node.js LTS, and the Angular CLI (`npm install -g @angular/cli`).

---

## 1. How you (Copilot) must work

- You are the lead developer. The human is a beginner who reviews and runs your work.
- Work **one task at a time, one phase at a time**. Never start the next phase until the human says `next`.
- Before writing code, state which files you will create or change. After writing, list the exact commands to run and how to verify.
- Follow the rules in section 3 and the data model in section 4 exactly. Do not add libraries that are not listed there without asking.
- Do not invent business logic or generate fake placeholder code. If something is unclear, ask one short question first.
- Keep the code simple and readable. This is a small app maintained by one person.
- After finishing a phase, tick its boxes in section 9 of this file.
- Always keep the app working: the backend tests pass and the frontend builds before you say a phase is done.

### Step 0: Project setup (do this before Phase 1)

1. Initialize Git in this folder (`git init`) and make a first commit containing this file.
2. Create the folder `.github/` and the file `.github/copilot-instructions.md`. Its content is **exactly** the text between `BEGIN copilot-instructions` and `END copilot-instructions` in section 3 (without the markers).
3. Create the empty folders `backend/`, `frontend/`, `launcher/`, and a root `README.md` with a 10-line description of the project and how to run it (fill it in as the phases progress).
4. Commit. Then start Phase 1.

---

## 2. Project summary

A local, single-user desktop-style application for a mobile phone shop. The shop sells phones, accessories and repair parts, and offers repair services. It runs on one Windows laptop, offline, started by clicking a desktop icon.

**Features**
- Point of Sale (fast checkout, keyboard and scanner friendly, receipts).
- Inventory: phones tracked per unit by IMEI, accessories and parts tracked by quantity, stock history, low-stock alerts.
- Repair ticketing: intake, status flow, parts used, labor, deposits, payments, intake slip, final receipt, WhatsApp "ready for pickup" link.
- Dashboard: today's sales, repair income, gross profit, open repairs, low stock, ready for pickup, credit owed.
- Customers with credit balances (sales can be partly paid, "dette").
- Warranty tracking and a device lookup by IMEI.
- Expenses and a printable end-of-day report.
- CSV import and export of the product catalog; CSV export of sales.
- Shop settings page.
- **Bilingual UI: French and Arabic (right-to-left).**

**Out of scope on purpose:** user accounts or login, VAT/tax invoicing, supplier purchase orders, SMS gateways, multi-store, cloud sync.

**Tech stack**
- Backend: Python 3.12, Django 5.2 LTS, Django REST Framework, django-filter, django-cors-headers, WhiteNoise, Waitress, pytest, pytest-django. Database: SQLite.
- Frontend: Angular (latest stable), standalone components, signals, new control flow (`@if`, `@for`), Angular Material (Material 3), Transloco for translations.
- Production: one process. Django serves the built Angular app at `/` and the API at `/api/` on `127.0.0.1:8000`. No CORS in production.
- Desktop feel: a Python launcher opens Microsoft Edge in app mode (`--app=`) from a desktop shortcut. No Electron.

---

## 3. Rules (copy into `.github/copilot-instructions.md` in Step 0)

<!-- BEGIN copilot-instructions -->
# Smart POS: Copilot Instructions

#### Project
A local, single-user desktop-style app for a mobile phone shop. It sells phones, accessories and repair parts, and offers repair services. Features: Point of Sale, Inventory (phones tracked by IMEI), Repair Tickets, Dashboard (today's sales, pending repairs, low stock), Customers with credit balances (dette), Warranty and IMEI device lookup, Expenses with an end-of-day report, CSV import/export, Shop settings. The UI is bilingual: French and Arabic (right-to-left).
Runs on one Windows laptop. No internet dependency, no user accounts, no multi-tenancy. The full brief is in PROJECT_BRIEF.md.

#### Stack
- Backend: Python 3.12, Django 5.2 LTS, Django REST Framework, django-filter, WhiteNoise, Waitress. Database: SQLite.
- Frontend: Angular (latest stable) with standalone components, signals, and the new control flow (@if, @for). UI: Angular Material (Material 3 theme). i18n: Transloco (@jsverse/transloco) with runtime language switching, languages fr and ar. No NgModules.
- Production: Django serves the built Angular app at / and the API at /api/. One process on 127.0.0.1:8000.
- Development: `python manage.py runserver` (port 8000) and `ng serve` (port 4200) with a proxy.conf.json forwarding /api to 8000.

#### Repository layout
- backend/ : Django project `config/` plus apps `catalog`, `inventory`, `customers`, `sales`, `repairs`, `shop` (ShopSettings, Expense), `dashboard` (summary and end-of-day report), and a small package `common`.
- frontend/ : Angular workspace. src/app/core (api services, models, interceptors, i18n), src/app/layout (shell, sidenav), src/app/features/<feature> (inventory, pos, repairs, dashboard, customers, devices, expenses, reports, settings), src/app/shared (reusable components, pipes).
- launcher/ : launcher.py, install.bat, create_shortcut.ps1, restore_backup.bat.

#### Backend rules
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

#### Frontend rules
- Standalone components with `ChangeDetectionStrategy.OnPush`; use signals (signal, computed, effect) for state; use `inject()` instead of constructor injection.
- One typed data service per API resource in core/api (e.g. ProductsApi) using HttpClient. TypeScript interfaces in core/models mirror the DRF serializers exactly. Never use `any`.
- Base URL is relative (`/api/`) so it works in dev (proxy) and production (same origin).
- Forms: typed reactive forms. Show validation errors under each field.
- UI: Angular Material components only (table, paginator, sort, dialog, snackbar, select, datepicker, chips, tabs, sidenav, toolbar). Keep a clean, modern, spacious look: neutral surfaces, one primary color, consistent 8px spacing, rounded cards, clear empty states and loading states.
- POS screen must be keyboard-first: autofocus the search/scan input, Enter adds the item, barcode/IMEI scanner input works as plain typing, and F-keys or clear buttons for pay/cancel.
- Lazy-load feature routes with loadComponent / loadChildren. Show success and error feedback with MatSnackBar.
- Format money with a MoneyPipe that reads the currency symbol from /api/settings/.

#### Internationalization (French + Arabic)
- The app is fully bilingual: French (fr, LTR) and Arabic (ar, RTL). Never hard-code user-facing text. Use Transloco keys in src/assets/i18n/fr.json and ar.json, grouped by feature (common, nav, inventory, pos, repairs, customers, devices, expenses, reports, dashboard, settings, errors). Every new key must be added to BOTH files in the same change.
- A toolbar switch (FR | عربي) changes the language. Store the choice in localStorage; the default comes from /api/settings/. On change set <html lang> and <html dir> (rtl for ar, ltr for fr).
- Use CSS logical properties only (margin-inline-start, padding-inline-end, inset-inline-start, text-align: start). Never use left/right in styles. Mirror directional icons (arrows, chevrons) in RTL.
- Angular Material supports RTL through the dir attribute. Check every dialog, table, form and the POS screen in both directions.
- Use Western digits (0-9) in both languages: register Angular locale data for fr and ar-DZ and format dates as dd/MM/yyyy.
- Fonts are bundled locally with @fontsource packages (a Latin font plus Noto Sans Arabic). Never load fonts, scripts or icons from a CDN: the app must work offline.
- Enum values from the API (status, reason, payment method, condition, kind, expense category) are codes. Translate them in the UI with keys such as status.RECEIVED. Never show the raw code.
- Angular sends an Accept-Language header on every request so backend messages come back in the current language.
- User-entered data (product names, customer names, notes) is stored exactly as typed in any language or script. Never translate or transliterate it. Search must work for French and Arabic text.
- Printed documents (receipts, repair slips, reports) render in the current UI language and direction and show the shop details and the receipt footer for that language.

#### Domain notes
- Phones are tracked per unit by IMEI (15 digits, unique, validated with the Luhn check). Accessories and parts are tracked by quantity.
- Sale numbers: S-YYYYMMDD-NNN. Repair ticket numbers: R-YYYYMMDD-NNN. Counters reset daily.
- Repair statuses: RECEIVED, DIAGNOSING, WAITING_PARTS, IN_REPAIR, READY, DELIVERED, CANCELLED. DELIVERED requires a zero balance.
- Voiding a sale reverses all of its stock movements.
- Warranty: Product.warranty_days is copied to SaleItem.warranty_until at sale time; RepairTicket.warranty_days runs from delivered_at. A device lookup by IMEI shows purchase, sales, repairs and whether warranty is active.
- Shop details, currency symbol, receipt footers (fr and ar) and default language come from the ShopSettings singleton, not from code.

#### How to work
- Do one focused task per request. Follow the existing structure and naming. Do not add libraries that are not listed above without asking.
- Before writing code, state which files you will create or change. After writing, list the commands to run and how to verify.
- Keep the code simple and readable; this is a small app maintained by one person.
- Do not generate placeholder or fake business logic. If something is unclear, ask a question first.
<!-- END copilot-instructions -->

---

## 4. Data model

Money is always `DecimalField(max_digits=10, decimal_places=2)`. Every model has `created_at` and `updated_at` (abstract `TimeStampedModel` in `common`).

### catalog
| Model | Fields | Notes |
| --- | --- | --- |
| Category | name (unique), kind (PHONE, ACCESSORY, PART) | Kind decides which screens and rules apply |
| Product | name, sku (unique), category, brand, model_name, cost_price, sell_price, track_imei, stock_qty (default 0), low_stock_threshold (default 2), is_active (default true), warranty_days (default 0) | For `track_imei=True` products, quantity is the count of IN_STOCK PhoneUnits |

### inventory
| Model | Fields | Notes |
| --- | --- | --- |
| PhoneUnit | product, imei (unique, 15 digits, Luhn-validated), condition (NEW, USED, REFURBISHED), cost_price, sell_price, status (IN_STOCK, RESERVED, SOLD, RETURNED; default IN_STOCK), purchased_at, supplier, notes | One row per physical phone |
| StockMovement | product, phone_unit (nullable), quantity_change, reason (PURCHASE, SALE, REPAIR_USE, ADJUSTMENT, RETURN, VOID), reference, note | Append-only ledger; every stock change writes one row |

### customers
| Model | Fields | Notes |
| --- | --- | --- |
| Customer | name, phone, notes | Property `balance` = sum of balances of their COMPLETED sales |

### sales
| Model | Fields | Notes |
| --- | --- | --- |
| Sale | number (unique, S-YYYYMMDD-NNN), customer (nullable), subtotal, discount, total, payment_method (CASH, CARD, TRANSFER), amount_paid, status (COMPLETED, VOIDED; default COMPLETED), notes | Properties `paid_total` = amount_paid + sum(payments), `balance` = total - paid_total. Created only through `create_sale()` |
| SaleItem | sale (related_name `items`), product, phone_unit (nullable), description, quantity, unit_price, unit_cost, line_total, warranty_until (nullable date) | Price, cost and description are snapshots |
| SalePayment | sale (related_name `payments`), amount, method (CASH, CARD, TRANSFER), paid_at (default now), note | Money collected after the sale (credit payments) |

### repairs
| Model | Fields | Notes |
| --- | --- | --- |
| RepairTicket | number (unique, R-YYYYMMDD-NNN), customer, device_brand, device_model, imei (blank allowed), issue_description, accessories_left (blank allowed), status (RECEIVED, DIAGNOSING, WAITING_PARTS, IN_REPAIR, READY, DELIVERED, CANCELLED; default RECEIVED), estimated_cost, labor_cost, deposit_paid, amount_paid, received_at (default now), promised_date, completed_at, delivered_at, technician_notes, warranty_days (default 0) | Properties `parts_total`, `total` = labor_cost + parts_total, `balance` = total - amount_paid |
| RepairPart | ticket (related_name `parts`), product, quantity, unit_price, unit_cost | Adding one decrements stock and writes a REPAIR_USE movement |

### shop
| Model | Fields | Notes |
| --- | --- | --- |
| ShopSettings (singleton, `get_solo()`) | shop_name, address, phone, currency_symbol (default 'DA'), country_dial_code (default '213'), receipt_footer_fr, receipt_footer_ar, default_language (fr or ar, default fr) | Edited from the Settings page |
| Expense | date, label, amount, category (RENT, UTILITIES, SUPPLIES, SALARY, OTHER), note | Daily cash-out log |

### Relationships
```
Category 1--* Product 1--* PhoneUnit
Product  1--* StockMovement (optional link to PhoneUnit)
Customer 1--* Sale 1--* SaleItem *--1 Product (optional PhoneUnit)
Sale 1--* SalePayment
Customer 1--* RepairTicket 1--* RepairPart *--1 Product
```

---

## 5. Business rules the services must enforce

- **Checkout (`create_sale`)**: one atomic transaction creates the Sale and items, decrements stock or marks the PhoneUnit SOLD, writes SALE StockMovements, and generates the number. Reject out-of-stock items, an already-sold IMEI, a discount above the subtotal, and empty carts.
- **Credit sales**: `amount_paid` may be below the total only when a customer is set; otherwise it must cover the total. Later payments are SalePayments (never more than the remaining balance), applied to the oldest unpaid sale first when collected from the customer page.
- **Warranty**: `SaleItem.warranty_until` = sale date + product.warranty_days when warranty_days > 0. A device is under warranty if its latest sale warranty or latest delivered repair (delivered_at + warranty_days) ends in the future.
- **Void (`void_sale`)**: only COMPLETED sales; set VOIDED, restore stock, set PhoneUnits back to IN_STOCK, write VOID movements. Voiding twice fails.
- **Repairs**: `completed_at` is set on READY and `delivered_at` on DELIVERED. DELIVERED is refused while the balance is above zero. DELIVERED and CANCELLED tickets cannot change status again. Overpayment is rejected. Removing a part restores stock.
- **Dashboard revenue**: completed Sales by sale date plus repair `amount_paid` of tickets delivered that day.
- **End-of-day net** = sales collected + debts collected + repair income - expenses.
- **Language**: error messages use gettext and follow `Accept-Language`.

---

## 6. Phases and tasks

Each task is one focused unit of work. Do them in order. After each task, run its **Check** and commit.

### Phase 1: Backend foundation

**Task 1.1: Bootstrap Django and SQLite**
- Create the Django backend in `backend/`.
- `requirements.txt`: Django>=5.2,<5.3, djangorestframework, django-filter, django-cors-headers, whitenoise, waitress, pytest, pytest-django.
- Create the Django project `config` and empty apps: catalog, inventory, customers, sales, repairs, shop, dashboard. Also a small package `common` for shared code.
- `settings.py`: SQLite at `BASE_DIR/'db.sqlite3'` with OPTIONS `init_command` `'PRAGMA journal_mode=WAL;'`. DEBUG and ALLOWED_HOSTS from env vars, defaulting to DEBUG=False and `['127.0.0.1','localhost']`. SECRET_KEY from env, otherwise generated once into `backend/secret.key`. REST_FRAMEWORK defaults: AllowAny, PageNumberPagination page size 25, DjangoFilterBackend + SearchFilter. CORS enabled only when DEBUG, for `http://localhost:4200`. WhiteNoise middleware, STATIC_ROOT, and a FRONTEND_DIR setting (`BASE_DIR.parent/'frontend_dist'`). CURRENCY_SYMBOL='DA' and SHOP_NAME='My Phone Shop' as defaults only (real values live in ShopSettings).
- Internationalization: USE_I18N=True, LANGUAGE_CODE='fr', LANGUAGES=[('fr','Français'),('ar','العربية')], LocaleMiddleware, LOCALE_PATHS=[BASE_DIR/'locale'], TIME_ZONE='Africa/Algiers' (change if the shop is elsewhere).
- Add `GET /api/health/` returning `{"status": "ok"}`.
- Add `.gitignore` (db.sqlite3, backups/, logs/, secret.key, .venv, node_modules, dist, frontend_dist, launcher/profile) and `pytest.ini`.
- Do not create models yet. List the exact commands to create the venv, install, migrate and run.

Check: `python manage.py check` passes, `runserver` starts, `/api/health/` returns `{"status": "ok"}`.

**Task 1.2: Models, admin and demo data**
- `common/models.py`: abstract TimeStampedModel. `common/validators.py`: Luhn-checked IMEI validator.
- Implement every model exactly as in section 4, with TextChoices for all choice fields, Decimal(10,2) for money, `__str__` methods and indexes on sku, imei, number and status. Include the properties (paid_total, balance, parts_total, total, Customer.balance) and `ShopSettings.get_solo()`.
- Register everything in admin with list_display, search_fields, list_filter.
- Generate migrations. Add a management command `seed_demo` creating 5 categories, 20 products, 8 phone units and 3 customers, with a realistic mix of French and Arabic names, and a default ShopSettings row.
- No services or API yet.

Check: `makemigrations` and `migrate` run clean, `seed_demo` fills data, everything is browsable in `/admin/` after `createsuperuser`.

### Phase 2: Services and REST API

**Task 2.1: Catalog and inventory API**
- `inventory/services.py`: `receive_phone(product, imei, condition, cost_price, sell_price, supplier, purchased_at)` creates a PhoneUnit, bumps Product.stock_qty and writes a PURCHASE StockMovement. `adjust_stock(product, delta, reason, note)` for accessories and parts writes a movement. Both atomic and validated (the product must or must not track IMEI accordingly).
- Serializers, ModelViewSets and urls for Category, Product, PhoneUnit, StockMovement (read-only), Customer. Product filters: category, category__kind, is_active, `?low_stock=true`. Search: name, sku, brand, model_name. PhoneUnit search by imei, filter by status and product. Creating a PhoneUnit through the API must call `receive_phone`.
- `GET /api/products/lookup/?q=` returns up to 10 products for the POS search. If q exactly matches an in-stock IMEI, return that PhoneUnit with its product first.
- `POST /api/products/{id}/adjust-stock/` takes `{delta, reason, note}` and calls `adjust_stock`.
- `GET` and `PUT /api/settings/` read and update the ShopSettings singleton.
- `POST /api/products/import-csv/` accepts a multipart CSV with columns sku, name, category, brand, model_name, cost_price, sell_price, stock_qty, low_stock_threshold, warranty_days; it creates or updates by sku, supports `?dry_run=true`, and returns created, updated and error rows with line numbers. Accept UTF-8 with BOM and comma or semicolon delimiters (Excel exports) so French and Arabic text survive. `GET /api/products/export-csv/` exports the catalog the same way. Add warranty_days to the product serializer.
- Tests for the services, the lookup and the CSV import.

Check: `pytest` passes; with demo data, `/api/products/?low_stock=true` and `/api/products/lookup/?q=<an imei>` return sensible results.

**Task 2.2: Checkout and sales API**
- `sales/services.py` `create_sale(items, customer_id, discount, payment_method, amount_paid)`: one transaction. Each item is either `{phone_unit_id}` (IMEI phones, quantity 1) or `{product_id, quantity}`. Validate stock and unit status, snapshot description, unit_price (allow a price override) and unit_cost on SaleItem, compute subtotal, discount and total with Decimal, mark PhoneUnit SOLD, decrement stock, write SALE StockMovements, and generate number S-YYYYMMDD-NNN (daily counter). Reject out-of-stock, already-sold IMEI, discount above subtotal, and empty carts with clear errors. Credit sales: amount_paid may be below the total only when customer_id is set; otherwise it must cover the total. Set SaleItem.warranty_until = sale date + product.warranty_days when warranty_days > 0. All error messages use gettext; create `locale/fr` and `locale/ar` .po files for them.
- `void_sale(sale)`: only COMPLETED sales; set VOIDED, restore stock, set PhoneUnits back to IN_STOCK, write VOID movements. Voiding twice must fail.
- API: `POST /api/sales/` with a nested SaleCreateSerializer calling `create_sale`, returning the full SaleSerializer with items. `GET` list and detail with filters `?date_from`, `?date_to`, `?status`, `?customer`, `?has_balance=true` and search by number. `GET /api/sales/export-csv/` with the same filters. `POST /api/sales/{id}/payments/` (amount up to the remaining balance, creates a SalePayment). `POST /api/sales/{id}/void/`.
- Tests: successful sale, out of stock, duplicate IMEI sale, discount rule, void restores stock, void twice, credit sale without a customer is rejected, payment above the balance is rejected, warranty date is set.

Check: `pytest` passes; a test sale through the API reduces stock and shows in `/admin/`.

**Task 2.3: Repairs API**
- `repairs/services.py`: `create_ticket(data)` generates R-YYYYMMDD-NNN. `change_status(ticket, new_status)` sets completed_at when READY and delivered_at when DELIVERED; DELIVERED is refused if balance > 0; CANCELLED and DELIVERED tickets cannot change status again. `add_part(ticket, product_id, quantity, unit_price)` decrements stock, snapshots cost, writes a REPAIR_USE movement; `remove_part` restores stock. `record_payment(ticket, amount)` increases amount_paid and rejects overpayment.
- API: RepairTicket ModelViewSet with nested read-only parts and computed parts_total, total, balance. Filters: `?status`, `?open=true` (not DELIVERED or CANCELLED), `?customer`; search by number, customer name, device model, imei. Actions: `POST status/`, `POST add-part/`, `DELETE parts/{id}/`, `POST payment/`. create_ticket and the serializer accept warranty_days. All messages use gettext.
- Tests for every rule above.

Check: `pytest` passes; from the browsable API you can create a ticket, add a part, record a payment and deliver it.

**Task 2.4: Device lookup, customer balances, expenses and end-of-day report**
- `GET /api/devices/lookup/?imei=` returns: the matching PhoneUnit with its product (if any); every SaleItem containing that IMEI (sale number, date, customer, price, warranty_until); every RepairTicket with that IMEI (number, status, received and delivered dates, warranty_days); and `warranty {active, ends_on, source: 'sale' or 'repair'}` based on the latest end date.
- Customer API: add `balance` to the serializer and a `?has_balance=true` filter. `GET /api/customers/{id}/statement/` returns their unpaid sales (oldest first, with balances) and their payments.
- shop app: Expense ModelViewSet with filters `?date_from`, `?date_to`, `?category` and search on label.
- dashboard app: `GET /api/reports/end-of-day/?date=` (default today) returns sales_count, sales_total, sales_collected_by_method (amount_paid of that day's sales per payment method), debts_collected_by_method (SalePayments that day), repair_income (amount_paid of tickets delivered that day), expenses_total, the expenses list, and net_total = collected sales + debts collected + repair_income - expenses_total. Put the queries in services using Decimal aggregates.
- Tests for each endpoint, including a warranty that has expired.

Check: `pytest` passes; looking up an IMEI sold in a test sale shows the sale and an active warranty; end-of-day numbers match a hand calculation.

### Phase 3: Angular scaffold and API connection

**Task 3.1: Workspace, Material theme, i18n and app shell**
- Create the Angular app in `frontend/` named `smart-pos-ui`: standalone, routing, SCSS, no SSR.
- Add Angular Material with a Material 3 theme: a clean light look, one primary color (indigo or teal), neutral surfaces, fonts bundled locally with @fontsource (no CDN), rounded corners, 8px spacing.
- Add `proxy.conf.json` forwarding `/api` to `http://127.0.0.1:8000` and wire it into `ng serve`.
- Set the production build output so `index.html` lands directly in `../frontend_dist` (`outputPath: { base: '../frontend_dist', browser: '' }`).
- Internationalization: install @jsverse/transloco with an HTTP loader for `src/assets/i18n/fr.json` and `ar.json` (default fr), and register Angular locale data for fr and ar-DZ. Create `core/i18n/language.service.ts` (signal-based): it stores the choice in localStorage, sets `<html lang>` and `<html dir>` ('rtl' for ar), and starts from the default language in `/api/settings/`. Add a language toggle button in the toolbar (FR | عربي). Bundle fonts locally with @fontsource packages (a Latin font plus Noto Sans Arabic) so nothing loads from the internet. All text in the shell uses translation keys present in both files, and all styles use CSS logical properties so the layout mirrors correctly in Arabic.
- Build `layout/shell.component`: collapsible mat-sidenav with nav items Dashboard, POS, Inventory, Repairs, Customers, Device lookup, Expenses, Reports, Settings (Material icons), and a toolbar showing the shop name.
- Add lazy-loaded routes (`loadComponent`) to simple placeholder pages for each feature, redirect '' to /dashboard, and add a not-found page.
- Use signals and OnPush everywhere. List the commands to run.

Check: `ng serve` shows the shell with working navigation, the language button switches between French and Arabic (Arabic flips the whole layout to right-to-left), and `ng build` writes `index.html` into `frontend_dist/`.

**Task 3.2: Typed API layer and shared pieces**
- `core/models`: TypeScript interfaces mirroring the Django serializers exactly: Page<T>, Category, Product, PhoneUnit, StockMovement, Customer, Sale, SaleItem, SaleCreate, RepairTicket, RepairPart, SalePayment, Expense, ShopSettings, DeviceHistory. Money fields are numbers parsed from DRF decimal strings; add a small helper that converts them.
- `core/api`: a generic `BaseApi<T>` (list(params), get, create, update, remove) using HttpClient and the relative base `/api/`. One injectable service per resource: ProductsApi, PhoneUnitsApi, CustomersApi, SalesApi (create, void, payments), RepairsApi (status, addPart, removePart, payment), plus SettingsApi, ExpensesApi, DevicesApi and ReportsApi.
- An HTTP error interceptor that shows DRF error messages (`{detail}` or field errors) in a MatSnackBar, and an interceptor that adds the `Accept-Language` header (the current UI language) to every request.
- A SettingsStore (signal-based) loaded at startup with `provideAppInitializer`, and a MoneyPipe using its currency symbol.
- Shared components: PageHeader (title + actions slot), EmptyState, and a ConfirmDialog opened through a ConfirmService.
- No feature screens yet.

Check: the toolbar shows the shop name from `/api/settings/`, and `ng build` has no type errors.

### Phase 4: Inventory screens

**Task 4.1: Product list, form and stock adjustment**
- Build `features/inventory/products`. Page with tabs Phones, Accessories, Parts (filter by category__kind).
- ProductsListComponent: mat-table with server-side pagination and sort, a debounced (300 ms) search box, filters for category and active, and a "Low stock only" toggle. Highlight rows at or below low_stock_threshold. Columns: name, sku, brand, category, stock, cost, price (MoneyPipe), actions (Edit, Adjust stock).
- ProductFormDialog: typed reactive form for create and edit, with required and number validators, and API field errors (for example duplicate SKU) shown under the field. The "track IMEI" switch only appears when the category kind is PHONE. Include a "Warranty (days)" number field.
- AdjustStockDialog: delta (positive or negative), reason and note, calling `POST /api/products/{id}/adjust-stock/`.
- Loading skeleton and an EmptyState when nothing matches.

Check: create, edit and search products against the seeded data; adjusting stock updates the table. Test in French and Arabic.

**Task 4.2: Phones by IMEI**
- Route `inventory/phones/:id`: product summary card, a table of its PhoneUnits (IMEI, condition, cost, price, status chip, purchased date) with a status filter, and a "Stock history" tab listing StockMovement rows.
- ReceivePhoneDialog: IMEI input (15 digits with a client-side Luhn validator that mirrors the backend), condition, cost, price, supplier and purchase date. Submit to `POST /api/phone-units/` and refresh the table.
- On the Phones tab add a "Find by IMEI" input; entering a full IMEI opens the matching phone's page.
- Reuse shared components and the existing API services.

Check: an invalid IMEI is rejected on the form, a valid one appears in the table, and the product's stock count rises by one.

**Task 4.3: CSV import and export**
- Add an "Import / Export" menu to the Inventory page.
- Import: a file picker for .csv, a link to download a template CSV with the expected columns, a "Check file" step calling `POST /api/products/import-csv/?dry_run=true` that shows created, updated and error counts plus a table of error rows with line numbers, then an "Import" button that runs it for real and refreshes the list.
- Export: a button downloading the catalog from `GET /api/products/export-csv/`.
- All text through Transloco in French and Arabic.

Check: import a CSV exported from Excel that contains French accents and Arabic names; both display correctly in the table.

### Phase 5: Point of Sale

**Task 5.1: Checkout screen**
- Build `features/pos/pos-page`, optimized for fast keyboard use.
- Two columns. Left: an autofocused search input (debounced 250 ms) calling `GET /api/products/lookup/?q=`, showing results as a compact list with name, price and stock. Pressing Enter on an exact IMEI match adds that phone to the cart immediately. Clicking a phone product without a scanned IMEI opens a dialog listing its in-stock units to pick from. Accessories and parts add with quantity 1, and adding again increases the quantity (never above available stock).
- Right: the cart panel driven by a signal-based CartStore (lines, add, remove, setQuantity, setPrice, setDiscount, clear, and computed subtotal and total). Each line shows name, IMEI if any, quantity stepper, editable unit price and line total. Empty-cart state included.
- Shortcuts: F2 focus search, F9 open payment, Esc clears the cart after a confirm.
- PaymentDialog: payment method toggle (cash, card, transfer), optional customer autocomplete, amount received, and computed change due. When a customer is selected the amount received may be below the total: show "Remaining on credit" and allow confirming as a credit sale. Without a customer, require the full amount. Confirm calls `SalesApi.create`. On success show a snackbar, emit an event to open the receipt (built in the next task), and start a fresh cart. Show backend errors such as "already sold" clearly.

Check: sell an accessory and a phone by IMEI; stock drops, the sold IMEI can no longer be added, and the sale appears in `/admin/`. Try a credit sale with a customer.

**Task 5.2: Receipt, printing and sales history**
- ReceiptComponent: shop name, address and phone from ShopSettings, sale number, date, customer if any, item lines (with IMEI and warranty end date when set), subtotal, discount, total, paid, change, remaining balance if on credit, and the receipt footer in the current language. Add `@media print` styles for an 80 mm receipt width that hide everything else; a Print button calls `window.print()`. Open it in a dialog right after a successful sale.
- `features/pos/history`: sales table with date-range filter, search by number, status chip, a "View receipt" action and a "Void" action (ConfirmDialog, then `POST /api/sales/{id}/void/`, then refresh). Voided sales appear greyed with a VOIDED chip. Add a CSV export button using `GET /api/sales/export-csv/`.

Check: print preview shows only the receipt, in both languages and directions; voiding a sale brings stock back.

### Phase 6: Repairs, customers, devices, settings and reports

**Task 6.1: Ticket list and board**
- Build `features/repairs` list views. The default route shows tickets with the "Open" filter on, plus status filter chips, search (number, customer, device, IMEI) and a toggle between Table and Board views.
- Table columns: number, customer, device, issue (truncated), days in shop, balance, status chip, actions. Use distinct, accessible colors for each status.
- Board view: one column per active status with MatCards showing number, device and customer; a card menu changes status through `RepairsApi.status` and shows backend errors (for example "balance must be zero before delivery").
- A "New ticket" button opening the form built in the next task.

Check: seed a few tickets through `/admin/`; both views show them and status changes persist.

**Task 6.2: Ticket intake form and detail page**
- New ticket page: customer autocomplete with "Add new customer" inline, device brand and model, IMEI (optional, Luhn-validated), issue description, accessories left, estimated cost, deposit paid, promised date, warranty days. On save, show a printable intake slip (ticket number, customer, device, deposit, promised date, a short terms line) using the same print approach as the receipt.
- Detail page `/repairs/:id`: header with number and a status dropdown, customer and device cards, parts table with an "Add part" dialog (product search via lookup, quantity, price) and remove, editable labor cost, a totals box (parts, labor, total, paid, balance), a "Record payment" dialog, and technician notes saved on blur. Add a "Print final receipt" button when status is DELIVERED. When status is READY show a "Notify by WhatsApp" button that opens `https://wa.me/<customer phone in international format using the country dial code from settings>?text=<translated message with the ticket number and shop name, in the current UI language>`.

Check: take a ticket from RECEIVED to DELIVERED, adding a part and paying the balance; part stock decreases and delivery is blocked until paid.

**Task 6.3: Customers screen**
- Build `features/customers`: a searchable table (name, phone), an add/edit dialog, and a detail page listing that customer's sales and repair tickets with totals. Show the customer's outstanding credit balance, add an "Owes money" filter and a balance column to the table, and add a "Collect payment" dialog that applies an amount to unpaid sales, oldest first, through `POST /api/sales/{id}/payments/`. Reuse shared components.

Check: opening a customer shows their purchase and repair history; collecting a part payment lowers the balance.

**Task 6.4: Device lookup and warranty**
- Build `features/devices`: a "Device lookup" page with an IMEI input (Luhn-validated), calling `GET /api/devices/lookup/?imei=`.
- Show a warranty banner (green "Under warranty until <date>" or red "No warranty"), then a timeline of the device: purchase (if it was in stock), each sale (link to the receipt) and each repair (link to the ticket).
- If the IMEI is unknown, show an empty state with buttons "Receive phone" and "New repair ticket" that open the existing forms with the IMEI prefilled.
- Add a warranty line to the receipt and to the repair slip when a warranty applies.

Check: look up an IMEI sold earlier in the POS and see its sale and warranty date.

**Task 6.5: Shop settings, expenses and end-of-day report**
- `features/settings`: a form for ShopSettings (shop name, address, phone, currency symbol, country dial code, receipt footer in French and in Arabic, default language). Saving updates the SettingsStore so receipts and the default language change immediately.
- `features/expenses`: a table with date-range filter and category chips, a total row, and an add/edit dialog (date defaults to today, label, amount, category, note).
- `features/reports`: an "End of day" page with a date picker (default today) calling `GET /api/reports/end-of-day/`, showing cards for sales count and total, collected by payment method, debts collected, repair income, expenses and net total, plus a Print button using the same print approach as the receipt, in the current language and direction.

Check: change the Arabic footer and see it on a printed Arabic receipt; the end-of-day net total matches a manual sum.

### Phase 7: Dashboard, one-icon launch and backups

**Task 7.1: Dashboard API and screen**
- Backend (dashboard app): `GET /api/dashboard/summary/` returning for today: sales_count, sales_total (COMPLETED only), gross_profit (sum of line_total minus unit_cost*quantity), repair_income (amount_paid of tickets delivered today), open_repairs_by_status, credit_owed_total (sum of balances of all completed sales), expenses_today, ready_for_pickup (up to 10 tickets), low_stock (up to 10 products at or below threshold), and last_7_days (date and sales total per day, zero-filled). Put the queries in `dashboard/services.py` using ORM aggregates. Add tests with a few created sales and tickets.
- Frontend: `features/dashboard` with KPI cards (Today's sales, Repair income, Gross profit, Open repairs, Credit owed), a 7-day bar chart drawn with plain SVG or CSS (no chart library), a "Ready for pickup" list linking to ticket pages, and a "Low stock" list linking to products. Auto-refresh every 60 seconds and a manual refresh button. Loading and empty states included.

Check: after a few test sales and a delivered ticket, the numbers match what you expect by hand.

**Task 7.2: Serve Angular from Django and build the launcher**
- Django: serve the built Angular app from FRONTEND_DIR. Use WhiteNoise for the static files and add a catch-all view that returns `index.html` for any path not starting with `/api/`, `/admin/` or `/static/`, so Angular routes survive a browser refresh. Configure collectstatic correctly for `/admin/`.
- `launcher/launcher.py` (Windows, standard library plus waitress): (1) log to `logs/app.log`; (2) run `migrate` programmatically; (3) copy `db.sqlite3` to `BACKUP_DIR/db-YYYYMMDD-HHMM.sqlite3` using sqlite3's backup API, keeping the newest 14; (4) if `127.0.0.1:8000` is already in use, only open the window; otherwise start waitress in a background thread; (5) find `msedge.exe` (fall back to `chrome.exe`, then the default browser) and start it with `--app=http://127.0.0.1:8000`, `--window-size=1366,800` and a dedicated `--user-data-dir` under `launcher/profile` so the process can be waited on; (6) when that window process exits, shut the server down cleanly and exit. If anything fails, show a simple Windows message box with the error and the log path, written in French and Arabic.
- Settings must read BACKUP_DIR from an optional `launcher/config.json` (default: `backups/` next to the database).

Check: run `ng build`, then `python launcher/launcher.py`; the app opens in its own window, a page refresh on `/pos` works, and closing the window ends the process.

**Task 7.3: Installer, shortcut and owner guide**
- `launcher/install.bat`: check that Python 3.12+ is on PATH (otherwise print a friendly message); create `.venv`; `pip install -r backend/requirements.txt`; run migrate and collectstatic; create the superuser only if none exists (prompt once); then call `create_shortcut.ps1`.
- `launcher/create_shortcut.ps1`: create a Desktop shortcut named "Smart POS" that runs `.venv\Scripts\pythonw.exe launcher\launcher.py` with the project folder as the working directory and `launcher\icon.ico` as its icon. Include a small script that generates a simple placeholder `icon.ico` with Pillow if none exists.
- `launcher/restore_backup.bat`: lists the files in the backups folder, asks which one to restore, makes a safety copy of the current database first, then replaces `db.sqlite3`.
- `OWNER_GUIDE.md` written twice, first in French and then in Arabic (right-to-left), in plain language for a non-technical shopkeeper: how to start the app, how to close it, where backups are, how to restore, what to do if the window does not open (check `logs/app.log`), and how to update safely.

Check: on a clean Windows user account, run `install.bat`, then use only the desktop icon to make a sale, create a ticket, close the window and reopen it with all data still there.

**Optional Task 7.4: Single `.exe` with PyInstaller** (only after the shop has used v1 for a while)
- Package the launcher with PyInstaller in one-folder mode (not one-file). Include the Django project, `frontend_dist`, templates and static files, and collect hidden imports for Django, DRF, django-filter and waitress. Add `launcher/build_exe.ps1` that outputs `dist/SmartPOS/SmartPOS.exe` with the icon and a windowed (no console) entry point. Keep `db.sqlite3`, `backups/` and `logs/` next to the exe, not inside the bundle. Explain how to test it on a machine without Python and how to avoid antivirus false positives.

---

## 7. Production settings checklist

- `DEBUG = False`, `ALLOWED_HOSTS = ["127.0.0.1", "localhost"]`, server bound to `127.0.0.1` only.
- `SECRET_KEY` generated on first run and saved to a local file.
- Angular build served by WhiteNoise; unknown non-API paths return `index.html`.
- Logs in `logs/app.log`; backup folder configurable (`BACKUP_DIR`), ideally a USB drive or synced folder.
- Everything works offline: no CDN fonts, scripts or icons.

---

## 8. Pre-launch checklist (human)

- [ ] Load the real catalog (CSV import or `/admin/`) and count a few items by hand against the app
- [ ] Receive 10 real phones by scanning their IMEIs and check that the scanner works in the POS search box
- [ ] A native Arabic reader and a French reader go through every screen, receipt and printed slip
- [ ] Print one receipt in Arabic and confirm the font, right alignment and number order look right
- [ ] Make a credit sale, collect a part payment and confirm the customer's balance
- [ ] Run one end-of-day report and compare it with the cash actually in the drawer
- [ ] Run the app in parallel with the shop's current method for 2 to 3 days
- [ ] Point `BACKUP_DIR` to a USB drive or synced folder and do one full restore test
- [ ] Print one repair slip on the shop's actual printer
- [ ] Give the owner `OWNER_GUIDE.md` and watch him start, use and close the app once without help

---

## 9. Progress tracker (Copilot: tick boxes as you finish)

- [x] Step 0: Git, `.github/copilot-instructions.md`, folders, README
- [x] Phase 1: Task 1.1 bootstrap, Task 1.2 models/admin/seed
- [x] Phase 2: Task 2.1 catalog/inventory API, 2.2 sales API, 2.3 repairs API, 2.4 devices/expenses/report
- [x] Phase 3: Task 3.1 Angular shell + i18n, 3.2 API layer
- [x] Phase 4: Task 4.1 products, 4.2 phones by IMEI, 4.3 CSV
- [x] Phase 5: Task 5.1 checkout, 5.2 receipt and history
- [x] Phase 6: Task 6.1 repairs list, 6.2 repair form/detail, 6.3 customers, 6.4 device lookup, 6.5 settings/expenses/reports
- [x] Phase 7: Task 7.1 dashboard, 7.2 launcher, 7.3 installer and owner guide
- [x] Optional: Task 7.4 PyInstaller exe
