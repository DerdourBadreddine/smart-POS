# Smart POS — Full Project Report

## 1. Project Overview

Smart POS is a bilingual desktop-style point-of-sale application for a mobile phone shop.

It supports:

- French and Arabic interfaces
- Right-to-left Arabic layout
- Phone sales
- Accessories and spare parts
- IMEI-tracked phones
- Repair tickets
- Customer credit balances
- Warranty and IMEI lookup
- Expenses
- End-of-day reports
- Inventory management
- CSV import/export
- Local SQLite database
- Windows standalone executable packaging
- Automatic backups

The application is designed for one shop, one Windows computer, and does not require user accounts, cloud services, or internet access.

## 2. Technology Stack

### Backend

- Python 3.12
- Django 5.2
- Django REST Framework
- django-filter
- SQLite
- Waitress
- WhiteNoise
- django-cors-headers

### Frontend

- Angular 19
- Standalone components
- Angular Material
- Signals
- Transloco
- French and Arabic translations
- RTL support

### Packaging

- PyInstaller
- Windows `.exe`
- One-folder client package
- No Python installation required for the client
- No Node.js installation required for the client

## 3. Completed Project Phases

### Phase 1 — Project Foundation

Completed:

- Created the Django project structure.
- Created the domain applications:
  - Catalog
  - Inventory
  - Sales
  - Repairs
  - Customers
  - Shop
  - Dashboard
  - Devices
- Configured SQLite.
- Added migrations.
- Added Django admin registrations.
- Created development setup files.
- Added a demo seed data command.
- Added project documentation.
- Added `.gitignore`.

Important commits:

```text
a3ea8c0 Initialize Smart POS project skeleton
79ad186 Build backend foundation
62fe10f Ignore generated artifacts
```

### Phase 2 — Backend Business Logic and APIs

#### Catalog and Inventory

- Product management
- Product categories
- Product types
- Stock quantities
- Cost and selling prices
- Low-stock thresholds
- Stock adjustments
- Stock movement history

#### IMEI Inventory

- Individual phone units
- IMEI validation
- Duplicate IMEI prevention
- Phone unit status
- Receiving phones
- Selling phone units
- Reserving and restoring phone units
- IMEI lookup

#### Sales

- Sale creation
- Sale items
- Product quantity validation
- Phone-unit sales
- Sale totals
- Discounts
- Customer credit sales
- Cash, card, and transfer payments
- Additional customer payments
- Sale voiding
- Stock restoration after voiding
- Receipt data

#### Repairs

- Repair tickets
- Repair status workflow
- Repair parts
- Labor charges
- Repair payments
- Repair status transitions
- Customer association
- Warranty tracking

#### Customers

- Customer records
- Customer phone numbers
- Customer credit balances
- Customer statements
- Payment collection

#### Shop and Reports

- Shop settings
- Expenses
- Daily expenses
- End-of-day reports
- Sales totals
- Profit calculations
- Credit balances

#### CSV

- Catalog export
- Catalog import
- Import validation
- Dry-run mode
- Error line reporting
- Created, updated, and rejected counts

Testing completed:

```text
13 backend tests passed
```

Important commit:

```text
a1bd29f Implement Phase 2 backend APIs
```

### Phase 3 — Angular Foundation

Completed:

- Created the Angular standalone workspace.
- Added Angular Material.
- Created the application shell.
- Added toolbar and side navigation.
- Added responsive layout.
- Added Transloco.
- Added French translations.
- Added Arabic translations.
- Added runtime language switching.
- Added RTL switching.
- Added typed API services.
- Added typed frontend models.
- Added HTTP error interceptor.
- Added language interceptor.
- Added settings store.
- Added money formatting pipe.
- Added development proxy to Django.
- Added local font assets.
- Disabled Angular analytics tracking.

Important commit:

```text
16dda1f Build Angular shell and typed API layer
```

### Phase 4 — Inventory and CSV Screens

#### Product Management

- Product table
- Product search
- Product filters
- Category filters
- Product type filters
- Low-stock highlighting
- Product creation
- Product editing
- Stock adjustment dialog
- Inventory status display

#### IMEI Phone Inventory

- Phone product detail page
- Phone unit table
- Phone unit status filters
- IMEI display
- IMEI validation
- Receive-phone dialog
- Stock movement history
- Find-by-IMEI workflow
- Luhn validation for IMEI numbers

#### CSV Workflow

- CSV template download
- CSV import screen
- Dry-run validation
- Error rows
- Error line numbers
- Created count
- Updated count
- Error count
- Catalog export
- French translations
- Arabic translations

Important commits:

```text
288a7a9 Build inventory product management screen
96ff666 Disable Angular analytics tracking
ae1b9d3 Build IMEI phone inventory flow
f59afb3 Add inventory CSV import and export
```

### Phase 5 — Point of Sale

Completed a keyboard-first POS workflow.

#### POS Features

- Product search
- Barcode-style input
- IMEI scanner input
- Exact IMEI matching
- Phone-unit selection
- Cart management
- Quantity changes
- Price editing
- Discounts
- Subtotals
- Total calculation
- Customer selection
- Credit sales
- Cash payment
- Card payment
- Transfer payment
- Payment dialog
- Receipt dialog

#### Keyboard Shortcuts

- `F2` — payment flow
- `F9` — cancel/clear flow
- `Escape` — close or cancel dialog

#### Sales History

- Sales history table
- Sale detail view
- Printable receipts
- Sale voiding
- Inventory restoration after voiding

Validation:

```text
13 backend tests passed
Angular production build passed
Django checks passed
```

Important commit:

```text
f74ef1b Build Phase 5 point of sale workflow
```

### Phase 6 — Repairs, Customers, Devices, Settings, and Reports

#### Repair Ticket List and Kanban

- Repair ticket list
- Search
- Open-only filter
- Status filter
- Table view
- Kanban board view
- Status transitions
- Error notifications
- French translations
- Arabic translations

Important commit:

```text
e59b6d9 Build repair ticket list and board
```

#### Repair Intake

- New repair ticket form
- Customer selection
- Device information
- Problem description
- Estimated price
- Deposit
- Expected completion date
- Warranty information

#### Repair Detail

- Repair ticket details
- Status changes
- Parts management
- Labor charges
- Notes
- Payment recording
- WhatsApp action
- Printable repair document

#### Customers

- Customer list
- Customer search
- Customer details
- Customer statement
- Credit balance
- Payment collection

#### Device Lookup

- IMEI lookup
- Warranty lookup
- Device sales history
- Customer information
- Warranty status

#### Shop Settings

- Shop name
- Address
- Phone
- Currency-related configuration
- Receipt settings
- Shop configuration screen

#### Expenses

- Expense list
- Add expense
- Edit expense
- Delete expense
- Expense categories
- Date filtering

#### Reports

- End-of-day report
- Sales totals
- Expenses
- Profit
- Credit totals
- Payment breakdown

#### Angular Bundle Budget

The initial Angular bundle warning budget was increased from 500 KB to 600 KB:

```json
{
  "type": "initial",
  "maximumWarning": "600kb",
  "maximumError": "1mb"
}
```

The final production bundle was below the warning threshold.

Important commit:

```text
1b34f1e Complete Phase 6 repair and shop screens
```

### Phase 7 — Dashboard and Production Release

#### Dashboard

- Today’s sales
- Today’s profit
- Pending repairs
- Ready-for-pickup repairs
- Credit outstanding
- Expenses
- Low-stock products
- Seven-day sales chart
- Dashboard refresh
- Summary API

Dashboard backend tests were added.

#### Production Django Serving

- Django serves the Angular app in production.
- Catch-all route for Angular navigation.
- WhiteNoise/static configuration.
- Production frontend path support.
- Same-origin API and frontend serving.

#### Backups

- Automatic SQLite backup at startup
- Backup folder
- Fourteen-backup retention policy
- Backup restore script
- Safety copy before restore

#### Windows Tools

Created:

- Launcher
- Installer
- Shortcut creator
- Backup restore script
- Configuration file
- Client build scripts

Important files:

- [launcher.py](./launcher/launcher.py)
- [install.bat](./launcher/install.bat)
- [create_shortcut.ps1](./launcher/create_shortcut.ps1)
- [restore_backup.bat](./launcher/restore_backup.bat)

#### Documentation

Created and updated:

- [README.md](./README.md)
- [OWNER_GUIDE.md](./OWNER_GUIDE.md)

The owner guide includes French and Arabic instructions for:

- Starting the application
- Using sales
- Repairs
- Reports
- Backups
- Restoring backups
- Updating the application
- Using the executable

Important commit:

```text
7d9d59c Complete Phase 7 release tooling and dashboard
```

## 4. Standalone Windows Executable

The optional standalone packaging task was completed.

Created:

- [build_exe.ps1](./launcher/build_exe.ps1)
- [build_client_package.ps1](./launcher/build_client_package.ps1)

The executable is located at:

```text
D:\coding\smart POS\SmartPOS-Client\SmartPOS.exe
```

The client package contains:

```text
SmartPOS-Client\
├── SmartPOS.exe
├── _internal\
├── backend\
│   └── db.sqlite3
├── backups\
├── logs\
├── config.json
├── OWNER_GUIDE.md
└── README.txt
```

The client does not need:

- Python
- Node.js
- npm
- Angular CLI
- Django
- Visual Studio Code
- Internet access

The client only needs to double-click:

```text
SmartPOS.exe
```

Important packaging commits:

```text
c2eed0d Add optional PyInstaller executable packaging
cde91e2 Create client-ready SmartPOS release package
d929204 Include PyInstaller runtime in client package
4a11c4c Fix standalone client executable runtime
```

## 5. Packaging Problems That Were Fixed

### Missing Python DLL

Initial error:

```text
Failed to load Python DLL ... _internal\python312.dll
```

Cause:

- Only the executable had been copied.
- The PyInstaller `_internal` directory was missing.

Fix:

- Updated the package builder to copy the complete PyInstaller output directory.
- Confirmed that `_internal\python312.dll` exists.

### Missing Dynamic Django Modules

Initial packaged runtime errors were caused by dynamic imports not being automatically detected.

Added PyInstaller support for:

- `corsheaders`
- WhiteNoise
- Django REST Framework
- DRF routers
- django-filter
- Project Django applications

### Production Route Returning 404

Cause:

- The frozen executable inherited development mode.
- The Angular catch-all route was disabled.

Fix:

Frozen mode now forces:

```text
DJANGO_DEBUG=0
```

### Blank White Browser Page

The blank page was caused by incorrect production frontend asset routing.

#### Cause

The root page returned Angular’s `index.html`, but requests for frontend assets such as:

```text
main-AX5JF7RS.js
styles-GRIGAOZM.css
```

were incorrectly sent to the Angular fallback route, which returned `index.html` again.

Therefore:

- JavaScript requests received HTML.
- CSS requests received HTML.
- Angular could not bootstrap.
- The browser displayed an empty page.

#### Fix

Updated [backend/config/urls.py](./backend/config/urls.py) to:

- Serve real frontend assets from the bundled frontend directory.
- Detect JavaScript, CSS, font, image, and other asset paths.
- Return proper MIME types.
- Keep Angular route fallback for application routes.
- Reject files outside the frontend directory.

Verification results:

```text
Root page: HTTP 200
Angular root element: present
JavaScript files: HTTP 200, text/javascript
CSS files: HTTP 200, text/css
API: HTTP 200
```

## 6. Current Application Status

The application is functionally complete for the planned scope.

Completed:

- Backend
- Frontend
- POS
- Inventory
- IMEI tracking
- Repairs
- Customers
- Credit balances
- Device lookup
- Warranty lookup
- Expenses
- Reports
- Dashboard
- CSV workflows
- French interface
- Arabic interface
- RTL layout
- Backups
- Restore tools
- Windows launcher
- Standalone executable
- Client documentation
- Production asset serving
- Blank-page issue fix

The packaged application was successfully tested at:

```text
http://127.0.0.1:8000
```

## 7. Testing Summary

Completed tests and checks:

```text
Backend test suite: passed
Django system checks: passed
Dashboard tests: passed
Angular production build: passed
Angular bundle budget: passed
Launcher syntax check: passed
PyInstaller build: passed
Packaged executable startup: passed
Frontend root response: HTTP 200
Frontend JavaScript assets: HTTP 200
Frontend CSS assets: HTTP 200
API response: HTTP 200
```

Known non-blocking warnings:

- Django staticfiles warning if `collectstatic` has not been run in source mode.
- DRF format suffix converter deprecation warning for future Django versions.
- Unsigned Windows executable may trigger Windows Defender warnings.

## 8. Files the Client Should Receive

The client should receive only this folder:

```text
D:\coding\smart POS\SmartPOS-Client
```

They should not receive:

- The source repository
- The backend development environment
- The Angular source
- Node modules
- Python virtual environments
- Development scripts unless needed for maintenance

The client should use:

```text
SmartPOS-Client\SmartPOS.exe
```

The client data is stored in:

```text
SmartPOS-Client\backend\db.sqlite3
```

Backups are stored in:

```text
SmartPOS-Client\backups
```

Logs are stored in:

```text
SmartPOS-Client\logs\app.log
```

## 9. Recommended Final Acceptance Test

Before handing the application to the client, perform this checklist on a separate Windows user account or clean computer:

1. Copy the complete `SmartPOS-Client` folder.
2. Double-click `SmartPOS.exe`.
3. Confirm the application opens.
4. Confirm the dashboard loads.
5. Switch to French.
6. Switch to Arabic.
7. Confirm RTL layout.
8. Create a test product.
9. Create a test customer.
10. Create a test sale.
11. Print or preview a receipt.
12. Create a repair ticket.
13. Add a repair part.
14. Record a repair payment.
15. Add an expense.
16. Open the daily report.
17. Confirm the database persists after closing and reopening.
18. Confirm a backup is created.
19. Test backup restoration.
20. Test with the client’s actual printer.
21. Check Windows Defender behavior.
22. Remove test records before handover.

## 10. Final Conclusion

Smart POS has reached the planned completion stage.

The project includes the full business workflow from inventory and sales through repairs, customers, expenses, reports, backups, and delivery packaging.

The client-ready folder is:

```text
D:\coding\smart POS\SmartPOS-Client
```

The latest blank-screen problem was identified and fixed at the production asset-routing level. The corrected executable successfully served the Angular application, JavaScript, CSS, and API responses.
