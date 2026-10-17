import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';
import { interval, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

interface DashboardSummary {
  sales_count: number;
  sales_total: number;
  gross_profit: number;
  repair_income: number;
  credit_owed_total: number;
  expenses_today: number;
  open_repairs_by_status: Record<string, number>;
  ready_for_pickup: Array<{ id: number; number: string; device_brand: string; device_model: string }>;
  low_stock: Array<{ id: number; name: string; stock_qty: number; low_stock_threshold: number }>;
  last_7_days: Array<{ date: string; total: number }>;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, MoneyPipe, RouterLink, SlicePipe, TranslocoPipe],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);

  constructor() {
    interval(60000).pipe(
      startWith(0),
      switchMap(() => this.http.get<DashboardSummary>('/api/dashboard/summary/')),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (summary) => { this.summary.set(summary); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.http.get<DashboardSummary>('/api/dashboard/summary/').subscribe({
      next: (summary) => { this.summary.set(summary); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openRepairs(summary: DashboardSummary): number {
    return Object.values(summary.open_repairs_by_status).reduce((total, value) => total + value, 0);
  }

  maxDailyTotal(summary: DashboardSummary): number {
    return Math.max(...summary.last_7_days.map((day) => day.total), 1);
  }
}
