import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslocoPipe } from '@jsverse/transloco';
import { CustomersApi, ProductsApi, RepairsApi } from '../../core/api/resource-apis';
import { Customer, Product, RepairTicket } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-repair-detail-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, MoneyPipe, ReactiveFormsModule, RouterLink, TranslocoPipe],
  template: `
    @if (ticket(); as current) { <section class="page"><a mat-button routerLink="/repairs">← {{ 'repairs.back' | transloco }}</a><header class="page-header"><div><span class="eyebrow">{{ current.number }}</span><h1>{{ current.device_brand }} {{ current.device_model }}</h1><p>{{ current.issue_description }}</p></div><mat-select [value]="current.status" (valueChange)="changeStatus($event)">@for (status of statuses; track status) {<mat-option [value]="status">{{ ('repairs.statuses.' + status) | transloco }}</mat-option>}</mat-select></header>
      <div class="detail-grid"><section class="info-card"><h2>{{ 'repairs.parts' | transloco }}</h2>@for (part of current.parts; track part.id) {<div class="part-row"><span>{{ part.product_name }} × {{ part.quantity }}</span><strong>{{ part.quantity * part.unit_price | money }}</strong><button mat-button color="warn" (click)="removePart(part.id)">{{ 'common.remove' | transloco }}</button></div>}<div class="add-part"><mat-form-field appearance="outline"><mat-label>{{ 'repairs.partSearch' | transloco }}</mat-label><input matInput [formControl]="partSearch"></mat-form-field><mat-form-field appearance="outline"><mat-label>{{ 'repairs.quantity' | transloco }}</mat-label><input matInput type="number" [formControl]="partQuantity"></mat-form-field><button mat-flat-button (click)="addPart()">{{ 'common.add' | transloco }}</button></div></section>
      <section class="info-card"><h2>{{ 'repairs.totals' | transloco }}</h2><p>{{ 'repairs.partsTotal' | transloco }}: {{ current.parts_total | money }}</p><mat-form-field appearance="outline"><mat-label>{{ 'repairs.labor' | transloco }}</mat-label><input matInput type="number" [formControl]="labor" (blur)="saveLabor()"></mat-form-field><p>{{ 'repairs.total' | transloco }}: <strong>{{ current.total | money }}</strong></p><p>{{ 'repairs.paid' | transloco }}: {{ current.amount_paid | money }}</p><p>{{ 'repairs.balance' | transloco }}: <strong>{{ current.balance | money }}</strong></p><button mat-flat-button color="primary" (click)="pay()" [disabled]="current.balance <= 0">{{ 'repairs.recordPayment' | transloco }}</button></section>
      <section class="info-card"><h2>{{ 'repairs.notes' | transloco }}</h2><textarea class="notes" [value]="current.technician_notes" (blur)="saveNotes($event)"></textarea>@if (current.status === 'READY') {<button mat-stroked-button (click)="whatsapp()">{{ 'repairs.whatsapp' | transloco }}</button>}@if (current.status === 'DELIVERED') {<button mat-stroked-button (click)="print()">{{ 'repairs.printReceipt' | transloco }}</button>}</section></div></section> } @else { <p>{{ 'common.loading' | transloco }}</p> }
  `,
  styles: [`.detail-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; } .info-card { display: grid; gap: 10px; padding: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; } .part-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; border-block-end: 1px solid #edf0f2; padding: 8px 0; } .add-part { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .notes { min-height: 120px; padding: 10px; border: 1px solid #cbd2da; border-radius: 8px; font: inherit; } @media (max-width: 800px) { .detail-grid { grid-template-columns: 1fr; } }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly repairsApi = inject(RepairsApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly customersApi = inject(CustomersApi);
  private readonly snackBar = inject(MatSnackBar);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly ticket = signal<RepairTicket | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly products = signal<Product[]>([]);
  readonly statuses: RepairTicket['status'][] = ['RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'IN_REPAIR', 'READY', 'DELIVERED', 'CANCELLED'];
  readonly partSearch = inject(FormBuilder).nonNullable.control('');
  readonly partQuantity = inject(FormBuilder).nonNullable.control(1, Validators.min(1));
  readonly labor = inject(FormBuilder).nonNullable.control(0, Validators.min(0));
  constructor() { this.load(); }
  load(): void { this.repairsApi.get(this.id).subscribe((ticket) => { this.ticket.set(ticket); this.labor.setValue(ticket.labor_cost); this.customersApi.get(ticket.customer).subscribe((customer) => this.customer.set(customer)); }); }
  changeStatus(status: RepairTicket['status']): void { this.repairsApi.status(this.id, status).subscribe({ next: (ticket) => this.ticket.set(ticket), error: (error) => this.snackBar.open(error.error?.detail ?? 'Status change failed', 'OK', { duration: 5000 }) }); }
  addPart(): void { const product = this.products().find((item) => item.name.toLowerCase().includes(this.partSearch.value.toLowerCase())); if (!product) { this.productsApi.lookup(this.partSearch.value).subscribe((items) => { this.products.set(items); }); return; } this.repairsApi.addPart(this.id, { product_id: product.id, quantity: this.partQuantity.value, unit_price: product.sell_price }).subscribe(() => this.load()); }
  removePart(partId: number): void { this.repairsApi.removePart(this.id, partId).subscribe(() => this.load()); }
  saveLabor(): void { const ticket = this.ticket(); if (ticket) this.repairsApi.update(this.id, { labor_cost: this.labor.value }).subscribe(() => this.load()); }
  saveNotes(event: Event): void { this.repairsApi.update(this.id, { technician_notes: (event.target as HTMLTextAreaElement).value }).subscribe(); }
  pay(): void { const ticket = this.ticket(); if (!ticket) return; const amount = Number(window.prompt('Payment amount', String(ticket.balance))); if (amount > 0) this.repairsApi.payment(this.id, amount).subscribe(() => this.load()); }
  whatsapp(): void { const customer = this.customer(); const ticket = this.ticket(); if (customer && ticket) window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(`${ticket.number} is ready`)}`, '_blank'); }
  print(): void { window.print(); }
}
