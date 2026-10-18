# Rebuild plan

18 October 2026. Continue automatically through phases as explicitly requested in CODEX_PROMPT.md; its workflow overrides the older wait-for-next rule copied into AGENTS.md. Keep the stack and user data. Never rewrite existing migrations; add a tested forward migration only when required by the historical-record rules.

## Priority and acceptance

1. Protect data and transaction boundaries (A06–A10, A15–A16, A19): regression tests for duplicate cart lines, cumulative stock, stock ledger, immutable terminal repairs, deposit persistence, collection allocation, frozen backup source and package preservation. Restrict destructive generic API methods. Accept when pytest passes and database effects are verified against isolated data.
2. Shared language and presentation (A01–A04, A13, A17): generate a real Material 3 theme; shared token, card, form, table, empty state and dialog styles. Money is a reactive shared formatter: FR nonbreaking thousands/comma decimal, AR Western digits/comma thousands/dot decimal, currency suffix and Unicode isolation. Dates dd/MM/yyyy. Translate field errors and service errors. Accept when production build, translation-key parity and bilingual browser checks pass.
3. Shell and dashboard: grouped navigation with accessible active state and compact mode, equal KPI heights, sixth expense KPI, SVG chart with labels and focusable values, linked lists and quick actions. Accept at both target viewports, FR/AR, with screenshots and axe.
4. POS (A05, A18 and cash tender): resolve scanner Enter against current input, stock limits, paid amount capped to total while retaining change, immediate complete receipt. Shared confirm dialog and shortcuts. Accept real UI sale, credit, receipt, void and restored stock.
5. Repair workflow: editable labor at intake, quick-add customer, selected parts rather than repeated blind click, translated payment form, printable slip/receipt, terminal restrictions. Accept add/remove part ledger and blocked delivery followed by payment/delivery.
6. Customers, expenses, devices, reports, settings: translated forms and complete CRUD; atomic oldest-first customer collection; customer sales/repair history; device warranty timeline; report payment breakdowns and manual arithmetic; printable shop details. Accept UI CRUD and database assertions.
7. Release: safe in-place package refresh preserving user files, backup/restore tests on copies, PyInstaller build, clean-folder packaged smoke and MIME checks. Finish report with evidence and explicit open items. Real printer/Defender require owner verification.

## Design system

Calm indigo primary (#3949ab), ink (#17233a), muted text (#536079), pale neutral canvas (#f4f6fa), white cards; green success, amber warning, red danger. Generated Material 3 styles with local Inter and Noto Sans Arabic. Eight-pixel spacing, 12/16/24/32px type hierarchy, 16px card corners, subtle elevation, tabular money. Reuse page headers, KPI cards, empty states, status chips, table/form wrappers, confirm and payment dialogs. Focus outlines remain visible; directions use logical CSS; directional icons mirror in RTL.

Dashboard uses a broad chart plus two operational lists; POS keeps a persistent cart and large scanner field; inventory retains tabs and improves row actions/history entry; repairs use table/board plus sectional detail with sticky totals; remaining screens share the same toolbar, table, form and empty-state components. Print styles isolate receipt at 80mm and report/repair on A4 with an 80mm option.

## Decisions and risks

- Keep repair income recognition on delivery, as section 5 of the brief specifies. Do not silently replace it with a payment-ledger accounting model.
- Repair deposits must be covered by an explicit labor charge at intake; estimated cost remains an estimate. Add the missing labor input rather than treating the estimate as money earned.
- Preserve all existing records. Final review established that repair descriptions need a snapshot to satisfy the historical-record rule. Add a forward field/backfill migration, test preservation and rename behavior, and migrate only copied data during acceptance. Previously lost historical names cannot be reconstructed.
- Reject invalid CSV rows atomically. Phone quantities are derived from IMEI units, never overwritten by CSV.
- Preserve existing client database, backup folder, logs and config during packaging. Never execute the baseline destructive package script.
- npm reports 40 dependency advisories after installing requested test tooling; record separately, do not run force-upgrades that change the required Angular stack.
- Baseline verification is only 16 tests. Add business regression coverage before changing those paths and real-browser evidence after changes; HTTP 200 and build success alone are insufficient.
- Every acceptance item remains pending until the named check has actually run. See AUDIT and REPORT for actual coverage rather than inferring completion from this plan.
