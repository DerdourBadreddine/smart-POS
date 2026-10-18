import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';

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
    MatToolbarModule, MatTooltipModule,
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
  readonly pageTitle=signal('nav.dashboard');
  private readonly router=inject(Router);
  constructor(){
    const update=()=>{let route=this.router.routerState.snapshot.root;while(route.firstChild)route=route.firstChild;this.pageTitle.set(route.data['titleKey']||'nav.dashboard');};
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event=>{if(event instanceof NavigationEnd)update();});update();
  }
  readonly collapsed = signal(false);
  readonly language = inject(LanguageService);
  readonly settings = inject(SettingsStore);
  readonly navigation: NavigationItem[] = [
    { path: '/dashboard', label: 'nav.dashboard', icon: 'space_dashboard' },
    { path: '/pos', label: 'nav.pos', icon: 'point_of_sale' },
    { path: '/sales', label: 'nav.sales', icon: 'history' },
    { path: '/inventory', label: 'nav.inventory', icon: 'inventory_2' },
    { path: '/repairs', label: 'nav.repairs', icon: 'build' },
    { path: '/customers', label: 'nav.customers', icon: 'groups' },
    { path: '/devices', label: 'nav.devices', icon: 'phonelink' },
    { path: '/expenses', label: 'nav.expenses', icon: 'receipt_long' },
    { path: '/reports', label: 'nav.reports', icon: 'assessment' },
    { path: '/settings', label: 'nav.settings', icon: 'settings' },
  ];
}
