import { Routes } from '@angular/router';

const featureRoutes = [
  { path: 'dashboard', titleKey: 'nav.dashboard' },
  { path: 'pos', titleKey: 'nav.pos' },
  { path: 'repairs', titleKey: 'nav.repairs' },
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
