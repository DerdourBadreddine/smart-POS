import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CustomersApi, RepairsApi } from '../../core/api/resource-apis';
import { Customer, Page, RepairTicket } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

type RepairStatus = RepairTicket['status'];

@Component({
  selector: 'app-repairs-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MoneyPipe,
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './repairs-page.component.html',
  styleUrl: './repairs-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairsPageComponent {
  private readonly repairsApi = inject(RepairsApi);
  private readonly customersApi = inject(CustomersApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transloco = inject(TranslocoService);
  private readonly snackBar = inject(MatSnackBar);

  readonly search = new FormControl('', { nonNullable: true });
  readonly tickets = signal<RepairTicket[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly openOnly = signal(true);
  readonly view = signal<'table' | 'board'>('table');
  readonly selectedStatus = signal<RepairStatus | ''>('');
  readonly total = signal(0);
  readonly columns = ['number', 'customer', 'device', 'issue', 'days', 'balance', 'status', 'actions'];
  readonly statuses: RepairStatus[] = ['RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'IN_REPAIR', 'READY', 'DELIVERED', 'CANCELLED'];
  readonly activeStatuses: RepairStatus[] = ['RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'IN_REPAIR', 'READY'];

  constructor() {
    this.customersApi.list({ page_size: 100, ordering: 'name' }).subscribe((page: Page<Customer>) => this.customers.set(page.results));
    this.search.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = { search: this.search.value.trim(), open: this.openOnly(), page_size: 100 };
    if (this.selectedStatus()) params['status'] = this.selectedStatus();
    this.repairsApi.list(params).subscribe({
      next: (page) => {
        this.tickets.set(page.results);
        this.total.set(page.count);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  customerName(id: number): string {
    return this.customers().find((customer) => customer.id === id)?.name ?? `#${id}`;
  }

  deviceName(ticket: RepairTicket): string {
    return `${ticket.device_brand} ${ticket.device_model}`.trim();
  }

  daysInShop(ticket: RepairTicket): number {
    return Math.max(0, Math.floor((Date.now() - new Date(ticket.received_at).getTime()) / 86400000));
  }

  ticketsFor(status: RepairStatus): RepairTicket[] {
    return this.tickets().filter((ticket) => ticket.status === status);
  }

  setOpenOnly(value: boolean): void {
    this.openOnly.set(value);
    this.load();
  }

  setStatus(status: RepairStatus | ''): void {
    this.selectedStatus.set(status);
    this.load();
  }

  setView(view: 'table' | 'board'): void {
    this.view.set(view);
  }

  changeStatus(ticket: RepairTicket, status: RepairStatus): void {
    if (ticket.status === status) return;
    this.repairsApi.status(ticket.id, status).subscribe({
      next: () => this.load(),
      error: (error: { error?: { detail?: string } }) => {
        const message = error.error?.detail ?? this.transloco.translate('repairs.statusChangeFailed') ?? '';
        this.snackBar.open(message, this.transloco.translate('common.close'), { duration: 6000 });
      },
    });
  }
}
