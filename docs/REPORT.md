# Smart POS redesign — verification report

18 October 2026. Work is on branch `redesign`. The stack and section 5 accounting rules were retained. One forward migration adds immutable repair-part descriptions without deleting existing records. Optional dark mode, density and command search were skipped.

## Delivery and data safety

The rebuilt package is **`release/SmartPOS-Client/SmartPOS.exe`**. Keep its `_internal` folder beside it. The original `SmartPOS-Client` executable was running and locked, so it was deliberately left untouched. Close the old app before starting the new release on the normal port 8000. Owner instructions describe transferring data only while the application is closed.

The repository database was copied using SQLite's backup API. All created products, customers, sales, repairs and expenses belong to ignored `.audit-data` copies. The original root database SHA-256 is `DF7A43D5F3DB16AD7346B280593AE1C21171517EE4BB0ED9FEE23ACF5EBACC68`; the original client database still has its 17 October modification time. No existing user backup folder was deleted. The release builder preserves database, backups, logs and configuration, and stages source without SQLite files. Generated `staticfiles` remain on disk but are no longer tracked by Git.

## What changed and how it was checked

| Audit IDs | Change | Evidence |
| --- | --- | --- |
| A01–A03 | Generated Material 3 theme, tokens, grouped/compact navigation, shared page/KPI/empty-state/dialog blocks, six equal-height dashboard KPIs, explicit SVG chart and empty state | `screenshots/before/`, `screenshots/after/`, route accessibility tests |
| A02, A13 | Reactive money formatter uses settings currency, FR NBSP thousands/comma decimals, AR Western digits/comma thousands/dot decimals, suffix currency with directional isolation; device dates and enum translations | Bilingual receipt assertions, dashboard/device screenshots, i18n checks |
| A04, A17 | Server field/detail errors displayed; translated network/fallback messages; development URL/status logging; French/Arabic gettext catalogs; consolidated Transloco configuration to fix raw snackbar keys | `config/tests/test_error_language.py`; live blocked-delivery assertion; browser mutation guard rejects raw keys |
| A05, A18 | Scanner Enter resolves current text, receipt opens after checkout, cash tender capped at actual total while change is displayed, stock limits and cent-based cart totals | IMEI/scanner and extended POS browser tests in both languages and viewports |
| A06 | Aggregate demand and duplicate IMEI checks; invalid nested checkout input returns validation errors; generic mutation/deletion of sales disabled | `sales/tests/test_regressions.py` (first run failed before fixes) |
| A07–A08 | Catalog writes and atomic CSV import moved into services; every stock delta writes a movement; preview/error imports roll back; generic phone mutations disabled; IMEI checked in service | `catalog/tests/test_import_regressions.py`, inventory service tests, CSV and inventory browser flows |
| A09–A10, A19 | Status/payment fields cannot bypass services; terminal repair finances locked; deposit persisted; explicit labor input at intake; part removal cannot create negative balance; blocked status control returns to actual server status | `repairs/tests/test_regressions.py`, repair service tests, part stock effects and blocked/delivered UI flows |
| A20 | Secondary collections follow every API page; expense totals, phone history, customer selectors and repair boards no longer silently stop at 25/100 rows | Shared `BaseApi.all`; bilingual workflow and route checks |
| A21 | Repair parts retain their name after a product rename | `repairs.0002_repairpart_description`; migration-preservation and rename regression assertions |
| A11 | Customer statement includes sales and repairs; translated collection dialog; payments allocated oldest-first atomically | `sales/tests/test_regressions.py::test_oldest_first_collection_is_atomic`, credit/collection browser flow |
| A12 | Expense Material form, correct date/category filters, edit/delete confirmation, translated categories and total | Extended packaged browser workflow adds, edits and deletes an expense |
| A14, A22, A25 | Shop details/footer, subtotal/discount/paid, customer, immediate cash change, IMEI and warranty in receipt; print isolation; repair warranty; A4 and 80mm daily report | `print-previews/` PDFs and rendered images; receipt/change and repair-warranty browser assertions |
| A15–A16 | Back up writable database rather than bundle; explicit SQLite connection closure; unique backup/safety-copy names; 14 retained; safe staged packaging | `config/tests/test_backups.py`, actual packaged startup backup, restore CLI on another copy |
| A23–A24 | Ambiguous part names require a choice; exact SKU/single match can add directly; WhatsApp uses normalized international digits | Browser scenario verifies no stock is consumed before selection, other part remains unchanged, and captured wa.me URL has the shop dial code; no message sent |
| A25–A27 | Shop-calendar warranty dates, linked/validated device timeline with prefilled reception, production mode for source launcher | Midnight warranty regression; device invalid/unknown/receipt/reception browser steps; source-launcher environment regression |

Other fixes: sale history date/search/status filters and CSV export, missing health endpoint, translated paginator labels, missing Material input/directive imports, inventory active-only=false semantics and finding sold IMEIs. Gross-profit and repair-income recognition retain the brief's rules. `dashboard/tests/test_accounting_regressions.py` verifies a hand calculation: sales collected 35 + debts 15 + delivered repairs 30 − expenses 7.50 = **72.50**. Device tests cover unknown IMEI and active/expired repair warranty.

## Executed verification

| Check | Result / artifact |
| --- | --- |
| Backend | **36 passed** with `python -m pytest -q`; Django check clean; `makemigrations --check --dry-run` found no unrecorded model changes. Baseline was 16 tests. |
| Frontend production build | Passed with no budget warnings, 585.57 kB initial bundle against the unchanged 600 kB warning budget. |
| Translation/static template check | **313 matching keys** in FR/AR; no literal template UI text or replacement-character sequences found by `npm run check:i18n`. |
| Main source browser matrix | **16 passed** in `verification/source-browser.json`; after replacing the custom template pipe with native Transloco, **8 additional bilingual follow-up cases passed**, recorded in `verification/source-native-pipe-browser.json`. |
| Clean-folder packaged browser matrix | **16 passed on the final native-pipe assets**, in `verification/packaged-browser.json`; executable runs with copied data and an isolated port. |
| Browser checks | French/Arabic × 1366×768/1920×1080; unexpected page/console/network/external-request errors and visible raw keys fail tests. An explicitly asserted translated HTTP 400 is allowed only for the blocked-delivery negative case. |
| Accessibility | axe scans all 11 main routes in the matrix; screenshots additionally cover phone and repair detail. Latest sweep: zero serious/critical violations, page errors, HTTP failures or external requests. Moderate shell landmark findings remain. |
| Screenshots | 22 baseline images; latest 26-route after sweep plus retained earlier detail captures. Machine-readable observations are in `browser-before.json` and `browser-after.json`. Baseline detail screens were not captured. |
| Packaged MIME | `packaged-mime.json`: curl checks HTML, JS, CSS, both JSON files and WOFF2; all correct. A missing JS asset returns 404 rather than HTML fallback. |
| Packaging | `build_client_package.ps1` invoked `build_exe.ps1`; final run exited successfully. Fresh copied EXE started Waitress, served the UI and created a database backup. |
| Restore | CLI restored a packaged startup backup onto `.audit-data/restore-acceptance`, retained a unique safety copy; automated retention/restore test also passed. |

The four browser scenarios per project cover inventory create/edit/adjust, CSV template/export/preview/import, IMEI reception with invalid check-digit refusal, scanner sale and warranty, quantity limits, override/discount, cash change, refusal of anonymous credit, saved footer/default language, state-preserving language switch, quick-add customer, credit collection, void/restored stock, repair deposit/parts/payment/delivery refusal and delivery, board/table toggle, expense CRUD, report arithmetic, printing and route accessibility.

## Limits and remaining owner acceptance

This report does **not** certify the entire long-form prompt's exhaustive feature-by-feature failure matrix. The following remain open or require manual checks:

- The overflow diagnostic reports Material touch targets and notched-outline internals. Document width is tested, but arbitrary text clipping for every possible real catalog value and every dialog is not certified. Baseline/after screenshots are viewport captures of internally scrolling screens, not complete captures of every scroll position or dialog state.
- Secondary lists now load all server pages. Very large real datasets still need performance review because several of those screens render the complete filtered result rather than paginating the rendered rows.
- Templates now use Transloco's native reactive pipe with a bundled offline JSON loader; imperative strings use the same corrected configuration. Static analysis checks templates and native prompts, not every possible dynamically composed string.
- Actual printer output, paper cutting, Arabic glyph shaping on the shop printer, real scanner timing and Windows Defender behavior require the shop's hardware. Generated PDFs/images verify browser print styling, not physical printing.
- GUI browser-window shutdown/reopen behavior and the native Windows restore picker were not driven automatically; executable verification uses `--serve-only`. Restore logic and the source CLI were tested on copies. The WhatsApp URL and visibility are checked by capturing window.open; sending a message is not performed.
- The original sale schema records money actually collected, not cash tender. Immediate receipts now show change; a historical reprint cannot reconstruct an old tender/change amount that was never stored.
- Full accessibility certification beyond serious/critical axe findings is not claimed. Moderate brand/toolbar landmark findings remain.
- npm reported **40 dependency advisories** (2 low, 10 moderate, 26 high, 2 critical) after test-tool installation. No forced dependency upgrade or stack migration was applied. PyInstaller emits optional Django/DRF schema/backend discovery warnings; runtime verification passed. Pytest retains five DRF converter deprecation warnings. The source-mode migration step in the client builder logs `staticfiles.W004`; the frozen launcher supplies its actual frontend directory and asset checks pass. Waitress logs transient queue-depth warnings during parallel asset fetches.

Recommended hand checks: open the new release with a copy of the real catalog, compare stock/credit totals, navigate longer lists, print a French and Arabic receipt/repair slip and both report widths, receive/sell a phone using the physical scanner, close/reopen the app, and perform a native-picker restore onto a disposable copy.

Migration `repairs.0002_repairpart_description` fills existing part descriptions from the linked product's current name and snapshots the name for future additions. Historical names that were already lost before this change cannot be reconstructed. The migration regression test preserves the existing part's ID, quantity, price, product stock and customer relationship. Standard x86 Edge detection and the writable browser profile path have a launcher regression test.

The migration was also exercised by the actual packaged EXE against an isolated pre-0002 database containing two repair parts: both rows and their quantities/prices/costs were preserved, descriptions were backfilled, the migration was recorded, and SQLite integrity remained `ok`. See `verification/packaged-migration.json`. The EXE SHA-256, frontend-index equality, startup backup and restored-copy integrity checks are in `verification/release-checks.json`. Following the final native-pipe build, only frontend data files were refreshed in the package; the already-built Python executable was unchanged and the complete packaged suite was rerun.

## Reproduce

Use the isolated-server instructions in README. From `frontend`, run `npm run check:i18n`, `npm run e2e`, `npm run audit:ui`, and `node e2e/print-preview.cjs`. Set `BASE_URL` for a packaged server. From the root, run `python launcher/verify_mime.py --url http://127.0.0.1:8767` against the clean packaged acceptance copy. Never point mutation tests at the shop's live database.
