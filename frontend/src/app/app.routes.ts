import { Routes } from '@angular/router';

const featureRoutes = [
  { path: 'dashboard', titleKey: 'nav.dashboard' },
  { path: 'customers', titleKey: 'nav.customers' },
  { path: 'devices', titleKey: 'nav.devices' },
  { path: 'expenses', titleKey: 'nav.expenses' },
  { path: 'reports', titleKey: 'nav.reports' },
  { path: 'settings', titleKey: 'nav.settings' },
];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'inventory',
        data: { titleKey: 'nav.inventory' },
        loadComponent: () =>
          import('./features/inventory/products/products-page.component').then(
            (m) => m.ProductsPageComponent,
          ),
      },
      {
        path: 'inventory/phones/:id',
        data: { titleKey: 'nav.inventory' },
        loadComponent: () =>
          import('./features/inventory/phones/phone-product-page.component').then(
            (m) => m.PhoneProductPageComponent,
          ),
      },
      {
        path: 'sales',
        data: { titleKey: 'sales.title' },
        loadComponent: () =>
          import('./features/pos/sales-history-page.component').then(
            (m) => m.SalesHistoryPageComponent,
          ),
      },
      {
        path: 'pos',
        data: { titleKey: 'nav.pos' },
        loadComponent: () =>
          import('./features/pos/pos-page.component').then((m) => m.PosPageComponent),
      },
      {
        path: 'repairs/new',
        data: { titleKey: 'repairs.newTicket' },
        loadComponent: () =>
          import('./features/repairs/repair-form-page.component').then(
            (m) => m.RepairFormPageComponent,
          ),
      },
      {
        path: 'repairs',
        data: { titleKey: 'nav.repairs' },
        loadComponent: () =>
          import('./features/repairs/repairs-page.component').then(
            (m) => m.RepairsPageComponent,
          ),
      },
      {
        path: 'repairs/:id',
        data: { titleKey: 'nav.repairs' },
        loadComponent: () =>
          import('./features/repairs/repair-detail-page.component').then(
            (m) => m.RepairDetailPageComponent,
          ),
      },
      {
        path: 'customers',
        data: { titleKey: 'nav.customers' },
        loadComponent: () =>
          import('./features/customers/customers-page.component').then(
            (m) => m.CustomersPageComponent,
          ),
      },
      {
        path: 'devices',
        data: { titleKey: 'nav.devices' },
        loadComponent: () =>
          import('./features/devices/device-lookup-page.component').then(
            (m) => m.DeviceLookupPageComponent,
          ),
      },
      {
        path: 'settings',
        data: { titleKey: 'nav.settings' },
        loadComponent: () =>
          import('./features/settings/settings-page.component').then(
            (m) => m.SettingsPageComponent,
          ),
      },
      {
        path: 'expenses',
        data: { titleKey: 'nav.expenses' },
        loadComponent: () =>
          import('./features/expenses/expenses-page.component').then(
            (m) => m.ExpensesPageComponent,
          ),
      },
      {
        path: 'reports',
        data: { titleKey: 'nav.reports' },
        loadComponent: () =>
          import('./features/reports/end-of-day-page.component').then(
            (m) => m.EndOfDayPageComponent,
          ),
      },
      ...featureRoutes.map((feature) => ({
        path: feature.path,
        data: { titleKey: feature.titleKey },
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            (m) => m.PlaceholderPageComponent,
          ),
      })),
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/placeholder-page/placeholder-page.component').then(
        (m) => m.PlaceholderPageComponent,
      ),
    data: { titleKey: 'common.notFound' },
  },
];
