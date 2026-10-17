import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageService } from '../../core/i18n/language.service';
import { SettingsStore } from '../../core/stores/settings.store';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslocoPipe,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly language = inject(LanguageService);
  readonly settings = inject(SettingsStore);
  readonly navigation: NavigationItem[] = [
    { path: '/dashboard', label: 'nav.dashboard', icon: 'space_dashboard' },
    { path: '/pos', label: 'nav.pos', icon: 'point_of_sale' },
    { path: '/inventory', label: 'nav.inventory', icon: 'inventory_2' },
    { path: '/repairs', label: 'nav.repairs', icon: 'build' },
    { path: '/customers', label: 'nav.customers', icon: 'groups' },
    { path: '/devices', label: 'nav.devices', icon: 'phonelink' },
    { path: '/expenses', label: 'nav.expenses', icon: 'receipt_long' },
    { path: '/reports', label: 'nav.reports', icon: 'assessment' },
    { path: '/settings', label: 'nav.settings', icon: 'settings' },
  ];
}
