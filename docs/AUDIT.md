# Audit — in progress

Audit started 18 October 2026. No existing user database or backup is modified. Source findings below are distinguished from browser observations; an untested flow is never counted as passing.

## Baseline commands

- `python -m pytest` from backend: 16 passed, 5 DRF format-converter deprecation warnings.
- `python backend/manage.py check`: no issues.
- `npm run build -- --configuration production`: passed, initial 564.35 kB, no budget warnings.
- Isolated server: source Django with production assets, copied root database. WhiteNoise warns that isolated staticfiles is absent (frontend assets have their own handler).

## Defects

| ID | Screen | Actual / evidence | Expected | Severity | Suspected cause |
| --- | --- | --- | --- | --- | --- |
| A01 | All | Source: Material theme mixins absent | Styled accessible Material controls | High | CSS variables alone do not generate component theme |
| A02 | Money | Source: CurrencyPipe uses default locale and prefix symbol | Language-aware grouped number followed by currency | High | No language input, pure pipe |
| A03 | Dashboard | Source: percent-height bars in indefinite container; no values | SVG with explicit coordinates, labels and empty state | Medium | CSS chart sizing |
| A04 | Errors | Source: nested field errors discarded, English fallback | Translated server details and field errors | High | Interceptor only reads detail/message |
| A05 | POS | Source: successful checkout never opens receipt | Receipt immediately after checkout | High | Receipt dialog not called |
| A06 | Checkout | Source: repeated phone or product lines validated independently | No duplicate IMEI or aggregate overselling | Critical | Validation precedes all stock writes |
| A07 | CSV | Source: direct stock update, no movement; invalid decimals/negative stock unchecked | Atomic validated import and ledger | Critical | Logic implemented in view via update_or_create |
| A08 | Inventory | Source: writable product stock and phone status bypass services | Ledger-preserving mutation paths | Critical | Generic ModelViewSet update |
| A09 | Repairs | Source: status, paid amounts and timestamps writable via generic update | Status/payment rules cannot be bypassed | Critical | Serializer write permissions |
| A10 | Repairs | Source: deposit removed from input and not saved; zero labor intake rejects deposit | Deposit retained, covered by actual repair total | High | pop deposit plus absent labor intake |
| A11 | Customers | Source: native English payment prompt and per-sale collection | Translated form, oldest-first atomic allocation | High | Missing collection service |
| A12 | Expenses | Source: wrong filter names, English prompts, no edit/delete/total | Complete translated CRUD and filters | High | Incomplete screen |
| A13 | Device lookup | Source: raw money, dates and status codes | Consistent money/date/enum display | Medium | Missing pipes |
| A14 | Print | Source: receipt missing shop/footer/IMEI/warranty; no isolated print stylesheet | Correct 80mm receipt and repair/report documents | High | Incomplete print implementation |
| A15 | Backups | Source: frozen backup reads bundled backend/db.sqlite3 | Back up writable ROOT/backend/db.sqlite3 | Critical | BACKEND points at bundle |
| A16 | Packaging | Source: client builder deletes entire existing release | Preserve database/backups/config/logs | Critical | Recursive release removal |
| A17 | i18n | Source: gettext calls without locale catalogs | French and Arabic service errors | High | Missing locale resources |
| A18 | Keyboard | Source: Enter relies on prior debounced results | Scanner input plus Enter resolves current query | High | Search race |
| A19 | Repairs | Source: parts/payment can change terminal tickets; labor can invalidate balance | Locked terminal financials, nonnegative balance | High | Missing service checks |

## Browser coverage
Pending Playwright installation and browser startup. Screenshots and screen-by-screen design observations will be recorded here. This is a working audit, not a declaration of completed acceptance.
