import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SalesApi } from '../../core/api/resource-apis';
import { Page, Sale } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ReceiptDialogComponent } from './receipt-dialog.component';

@Component({
  selector: 'app-sales-history-page',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatTableModule, MoneyPipe, RouterLink, TranslocoPipe],
  templateUrl: './sales-history-page.component.html',
  styleUrl: './sales-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesHistoryPageComponent {
  private readonly api = inject(SalesApi);
  private readonly dialog = inject(MatDialog);
  private readonly transloco = inject(TranslocoService);
  readonly sales = signal<Sale[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly columns = ['number', 'date', 'total', 'paid', 'balance', 'status', 'actions'];

  constructor() { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.list({ page: this.page() + 1, page_size: 25 }).subscribe({
      next: (result: Page<Sale>) => { this.sales.set(result.results); this.total.set(result.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  changePage(event: PageEvent): void { this.page.set(event.pageIndex); this.load(); }
  receipt(sale: Sale): void { this.dialog.open(ReceiptDialogComponent, { width: 'min(32rem, calc(100vw - 2rem))', data: sale }); }
  void(sale: Sale): void {
    if (!window.confirm(this.transloco.translate('sales.voidConfirm'))) return;
    this.api.void(sale.id).subscribe(() => this.load());
  }
}
