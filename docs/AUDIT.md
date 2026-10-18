# Audit

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
| A20 | Lists/history | Source: secondary lists/selectors consume only the first 25/100 rows | Follow all pages or provide pagination | High | Page response discarded after first request |
| A21 | Repair history | Source: renaming a product changes the historical repair-part label | Snapshot description when used | High | Serializer reads current Product.name |
| A22 | Receipt | Source: cash tender/change is discarded before receipt; customer name absent | Show customer and immediate cash change | Medium | Receipt receives only persisted sale fields |
| A23 | Repair parts | Source: partial search can select an unintended first match | Require explicit choice for ambiguous names | High | Search result chosen without user selection |
| A24 | WhatsApp | Source: local phone number used directly in wa.me URL | Normalize using shop dial code | Medium | Country setting unused |
| A25 | Warranty/print | Source: UTC date truncation can shorten warranty near local midnight; repair print lacks expiry | Use shop calendar date and print repair warranty | High | Date truncation and missing display field |
| A26 | Device lookup | Source/UI: missing invalid-input feedback and unknown-device receive shortcut; garbled timeline glyphs | Inline validation, prefilled reception, local Material icons and history links | Medium | Incomplete form/timeline |
| A27 | Source launcher | Source: non-frozen launcher retains DEBUG=1, root production page unavailable | Launcher always serves built frontend | High | Only frozen mode forces production settings |

## Browser observations and design review

The baseline browser pass saved 22 screenshots (11 routes × FR/AR) in `screenshots/before/`, with machine-readable results in `browser-before.json`. Port 8000 was subsequently identified as an already-running older package. That pass was strictly read-only. All fixture creation and subsequent workflow tests use isolated copied data on port 8765, and packaged copies on port 8766. No claim is made that the first baseline browser pass ran against the copied database.

| Screen | Baseline design / browser finding | Rebuild evidence |
| --- | --- | --- |
| Shell | Large undifferentiated sidebar; missing component theme | Grouped sections, compact icons, tooltips, visible active label, generated Material theme |
| Dashboard | Visible DA0.00; unframed uneven cards; zero-value chart is dashes; serious contrast failure | Shared KPI cards, six metrics, SVG values/dates, honest empty state; screenshots after in both languages |
| Inventory | Empty action-column header; phone detail not accessible from name | Named actions; linked phone rows, ledger preserving forms and CSV |
| POS | Empty-state contrast failure; receipt absent after checkout | Contrast corrected, sticky cart, shortcuts, immediate receipt, cash change calculation |
| History | Empty action header; no filters/export | Named actions, date/search/status filters, filtered CSV, confirm dialog |
| Repairs | Critical select/checkbox labeling errors; low-contrast empty state; blind repeated part action | Material input import and labels corrected, status progress, sticky totals, labor/deposit intake, one-click part lookup/add |
| Customers | Unnamed edit control; English prompt; missing repair history | Labeled actions, translated collection dialog, oldest-first allocation, sales/repair statement |
| Device lookup | Raw dates/prices/status | Shared date/money/enum formatting; live sold-IMEI warranty checked |
| Expenses | English prompts, ignored dates, incomplete CRUD | Material form, translated categories, correct filters, edit/delete and total |
| Reports | Hard-coded English cards and unformatted values | Translated KPIs, payment breakdown, shop details, print document |
| Settings | Critical/serious input naming issues; structural directives missing import | Actual labeled input/textarea controls render; translated success and language names |

The latest completed 26-route screenshot sweep has zero JavaScript page errors, zero HTTP failures, zero external requests, and zero serious/critical axe violations. The remaining moderate `region` finding concerns shell brand/toolbar landmarks. Automated overflow diagnostics include Material control internals (touch targets/notched outlines), so they are recorded as diagnostics rather than certified zero-overflow evidence. Follow-up print and packaged results are in REPORT.md.

Additional findings: cash tender above total was rejected; report labels were English; paginator labels were English; active-only=false filtered inactive products rather than all; inventory IMEI find only found in-stock phones; generic sale deletion bypassed the stock ledger; health endpoint and sales CSV export were absent. These were corrected during the rebuild. The running package prevented in-place replacement, so release output is now `release/SmartPOS-Client`.
