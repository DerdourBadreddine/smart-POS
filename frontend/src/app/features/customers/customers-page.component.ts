import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime } from 'rxjs';
import { CustomersApi } from '../../core/api/resource-apis';
import { Customer, Page } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-customers-page',
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatTableModule, MoneyPipe, ReactiveFormsModule, TranslocoPipe],
  template: `
    <section class="page"><header class="page-header"><div><span class="eyebrow">{{ 'customers.title' | transloco }}</span><h1>{{ 'customers.directory' | transloco }}</h1></div><button mat-flat-button color="primary" (click)="edit()"><mat-icon>add</mat-icon>{{ 'customers.add' | transloco }}</button></header>
    <div class="toolbar-card"><mat-form-field appearance="outline"><mat-label>{{ 'common.search' | transloco }}</mat-label><input matInput [formControl]="search"></mat-form-field><mat-checkbox [checked]="owing()" (change)="owing.set($event.checked); load()">{{ 'customers.owing' | transloco }}</mat-checkbox></div>
    <section class="table-card">@if (loading()) {<mat-progress-bar mode="indeterminate"/>}<table mat-table [dataSource]="customers()"><ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>{{ 'customers.name' | transloco }}</th><td mat-cell *matCellDef="let c"><strong>{{ c.name }}</strong></td></ng-container><ng-container matColumnDef="phone"><th mat-header-cell *matHeaderCellDef>{{ 'customers.phone' | transloco }}</th><td mat-cell *matCellDef="let c">{{ c.phone }}</td></ng-container><ng-container matColumnDef="balance"><th mat-header-cell *matHeaderCellDef>{{ 'customers.balance' | transloco }}</th><td mat-cell *matCellDef="let c">{{ c.balance | money }}</td></ng-container><ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let c"><button mat-button (click)="statement(c)">{{ 'customers.details' | transloco }}</button><button mat-icon-button (click)="edit(c)"><mat-icon>edit</mat-icon></button></td></ng-container><tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr></table></section>
  </section>
  `,
  styles: [`.toolbar-card,.table-card { padding: 16px; background:#fff; border:1px solid #e5e7eb; border-radius:16px; margin-block-end:16px; } table { width:100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPageComponent {
  private readonly api = inject(CustomersApi); private readonly dialog = inject(MatDialog); readonly search = inject(FormBuilder).nonNullable.control(''); readonly customers = signal<Customer[]>([]); readonly loading = signal(true); readonly owing = signal(false); readonly columns = ['name', 'phone', 'balance', 'actions'];
  constructor() { this.search.valueChanges.pipe(debounceTime(250)).subscribe(() => this.load()); this.load(); }
  load(): void { this.loading.set(true); this.api.list({ search: this.search.value, has_balance: this.owing(), page_size: 100 }).subscribe({ next: (page: Page<Customer>) => { this.customers.set(page.results); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  edit(customer?: Customer): void { this.dialog.open(CustomerDialogComponent, { data: customer }).afterClosed().subscribe((saved) => { if (saved) this.load(); }); }
  statement(customer: Customer): void { this.dialog.open(CustomerStatementDialogComponent, { width: 'min(42rem, calc(100vw - 2rem))', data: { customer, api: this.api } }); }
}

@Component({ selector: 'app-customer-dialog', imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, TranslocoPipe], template: `<h2 mat-dialog-title>{{ data ? ('customers.edit' | transloco) : ('customers.add' | transloco) }}</h2><mat-dialog-content><form [formGroup]="form" class="dialog-form"><mat-form-field appearance="outline"><mat-label>{{ 'customers.name' | transloco }}</mat-label><input matInput formControlName="name"></mat-form-field><mat-form-field appearance="outline"><mat-label>{{ 'customers.phone' | transloco }}</mat-label><input matInput formControlName="phone"></mat-form-field><mat-form-field appearance="outline"><mat-label>{{ 'customers.notes' | transloco }}</mat-label><textarea matInput formControlName="notes"></textarea></mat-form-field></form></mat-dialog-content><mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.cancel' | transloco }}</button><button mat-flat-button color="primary" (click)="save()">{{ 'common.save' | transloco }}</button></mat-dialog-actions>`, styles: [`.dialog-form{display:grid;gap:8px;min-width:min(28rem,75vw)}`], changeDetection: ChangeDetectionStrategy.OnPush })
export class CustomerDialogComponent { readonly form; constructor(private readonly fb: FormBuilder, private readonly ref: MatDialogRef<CustomerDialogComponent>, private readonly api: CustomersApi, @Inject(MAT_DIALOG_DATA) readonly data: Customer | null) { this.form = this.fb.nonNullable.group({ name: [data?.name ?? '', Validators.required], phone: [data?.phone ?? ''], notes: [data?.notes ?? ''] }); } save(): void { if (this.form.invalid) return; const request = this.data ? this.api.update(this.data.id, this.form.getRawValue()) : this.api.create(this.form.getRawValue()); request.subscribe(() => this.ref.close(true)); } }

@Component({ selector: 'app-customer-statement-dialog', imports: [MatButtonModule, MatDialogModule, MoneyPipe, TranslocoPipe], template: `<h2 mat-dialog-title>{{ data.customer.name }}</h2><mat-dialog-content>@if (loading()) {<p>{{ 'common.loading' | transloco }}</p>} @else {<p>{{ 'customers.balance' | transloco }}: <strong>{{ data.customer.balance | money }}</strong></p>@for (sale of sales(); track sale.id) {<div class="sale"><span>{{ sale.number }}</span><strong>{{ sale.balance | money }}</strong><button mat-button (click)="collect(sale.id, sale.balance)">{{ 'customers.collect' | transloco }}</button></div>}}</mat-dialog-content><mat-dialog-actions><button mat-button mat-dialog-close>{{ 'common.close' | transloco }}</button></mat-dialog-actions>`, styles: [`.sale{display:flex;gap:8px;align-items:center;padding:8px 0;border-block-end:1px solid #eee}`], changeDetection: ChangeDetectionStrategy.OnPush })
export class CustomerStatementDialogComponent { readonly sales = signal<Array<{ id: number; number: string; balance: number }>>([]); readonly loading = signal(true); constructor(@Inject(MAT_DIALOG_DATA) readonly data: { customer: Customer; api: CustomersApi }, private readonly dialog: MatDialogRef<CustomerStatementDialogComponent>) { data.api.statement(data.customer.id).subscribe((statement) => { this.sales.set(statement.unpaid_sales); this.loading.set(false); }); } collect(id: number, balance: number): void { const amount = Number(window.prompt('Payment amount', String(balance))); if (amount > 0) this.data.api.payment(id, { amount, method: 'CASH', note: '' }).subscribe(() => this.dialog.close(true)); } }
