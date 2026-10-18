# Architecture

## Runtime and storage
Windows launcher -> migrations -> SQLite backup -> Waitress on 127.0.0.1:8000 -> Django API and Angular assets. PyInstaller bundles code and frontend; writable data must remain beside the executable. `SMART_POS_DATA_DIR` controls the database at `<data>/backend/db.sqlite3`; `SMART_POS_FRONTEND_DIR` controls built assets. The repository also contains a root `db.sqlite3`; it is not the current settings default. Audit data is copied with SQLite's backup API into ignored `.audit-data/backend/db.sqlite3`.

## Backend
`config/settings.py`, `config/urls.py`: settings, routers, asset MIME handling, SPA fallback. Each domain has its own initial migration.

| Domain | Models / services | API |
| --- | --- | --- |
| catalog | Category, Product; CSV currently in views | categories, products, lookup, adjust-stock, import-csv, export-csv |
| inventory | PhoneUnit, StockMovement; receive_phone, adjust_stock | phone-units, stock-movements |
| sales | Sale, SaleItem, SalePayment; checkout, void, payment | sales, payments, void, export-csv |
| repairs | RepairTicket, RepairPart; create, status, parts, payment | repairs and nested actions |
| customers | Customer with computed sale balance | customers, statement |
| shop | ShopSettings singleton, Expense | settings, expenses |
| dashboard | summary and end_of_day aggregations | dashboard/summary, reports/end-of-day |
| devices | warranty/history queries across domains | devices/lookup |
| common | timestamp base, IMEI Luhn validator, seed_demo | health |

Money is stored as Decimal fields. Transactional services write the stock ledger. Baseline has 16 pytest tests, insufficient for the requested acceptance matrix. No backend translation catalogs exist in the baseline.

## Frontend
Angular 19 standalone lazy routes in `app.routes.ts`: dashboard, inventory, inventory/phones/:id, pos, sales, repairs, repairs/new, repairs/:id, customers, devices, expenses, reports, settings. Several duplicate placeholder routes are unreachable.

`core/api/base-api.ts` and `resource-apis.ts` wrap HttpClient. `core/models` contains API interfaces and a numeric conversion helper. `core/stores/settings.store.ts` initializes shop details. LanguageService controls Transloco, localStorage and document direction; translations are both bundled and served as local JSON. HTTP interceptors send Accept-Language and display errors.

`layout/shell` owns navigation and toolbar. Feature folders own screen components; several later screens use single-file inline templates and native browser prompts. `shared/pipes/money.pipe.ts` currently delegates to CurrencyPipe without language selection. Local fontsource assets supply Inter, Noto Sans Arabic and Material Icons. Global SCSS defines partial Material variables but no generated Material component theme.

## Packaging
`launcher/build_exe.ps1` builds Angular, collects static assets and runs PyInstaller. `build_client_package.ps1` copies dist into SmartPOS-Client. Baseline package builder recursively deletes an existing release (including potential data); it must be corrected before execution. `restore_backup.bat` restores a selected backup. `launcher.py` handles startup backup retention and browser lifecycle.
