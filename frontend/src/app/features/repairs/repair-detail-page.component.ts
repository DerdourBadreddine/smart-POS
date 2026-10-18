import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { AmountDialogComponent } from '../../shared/ui';
import { SettingsStore } from '../../core/stores/settings.store';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';
import { CustomersApi, ProductsApi, RepairsApi } from '../../core/api/resource-apis';
import { Customer, Product, RepairTicket } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-repair-detail-page',
  imports: [DatePipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, MoneyPipe, ReactiveFormsModule, RouterLink, TranslocoPipe],
  template: `
    @if (ticket(); as current) { <section class="page"><a mat-button routerLink="/repairs"><span class="directional" aria-hidden="true">&#8592;</span> {{ 'repairs.back' | transloco }}</a><header class="page-header"><div><span class="eyebrow">{{ current.number }}</span><h1>{{ current.device_brand }} {{ current.device_model }}</h1><p>{{ current.issue_description }}</p></div><mat-select  #statusControl [attr.aria-label]="'repairs.status'|transloco" [disabled]="current.status==='DELIVERED'||current.status==='CANCELLED'" [value]="current.status" (valueChange)="changeStatus($event,statusControl)">@for (status of statuses; track status) {<mat-option [value]="status">{{ ('repairs.statuses.' + status) | transloco }}</mat-option>}</mat-select></header>
      <ol class="status-progress no-print">@for(step of statuses.slice(0,5);track step){<li [class.current]="step===current.status">{{('repairs.statuses.'+step)|transloco}}</li>}</ol><section class="print-document"><h2>{{settings.shopName()}}</h2><p>{{settings.value()?.address}} &#183; {{settings.value()?.phone}}</p><p>{{customer()?.name}} &#183; {{customer()?.phone}} &#183; {{current.imei}}</p><h3>{{current.number}} &#183; {{current.device_brand}} {{current.device_model}}</h3><p>{{current.issue_description}}</p>@if(current.warranty_days > 0){<p>{{'repairs.warrantyDays'|transloco}}: {{current.warranty_days}} @if(current.warranty_until){<span>{{'pos.warranty'|transloco}} {{current.warranty_until|date:'dd/MM/yyyy'}}</span>}</p>}<div class="detail-grid"><section class="info-card"><h2>{{ 'repairs.parts' | transloco }}</h2>@for (part of current.parts; track part.id) {<div class="part-row"><span>{{ part.product_name }} × {{ part.quantity }}</span><strong>{{ part.quantity * part.unit_price | money }}</strong><button mat-button color="warn" [disabled]="current.status==='DELIVERED'||current.status==='CANCELLED'" (click)="removePart(part.id)">{{ 'common.remove' | transloco }}</button></div>}<div class="add-part"><mat-form-field appearance="outline"><mat-label>{{ 'repairs.partSearch' | transloco }}</mat-label><input matInput [formControl]="partSearch"></mat-form-field><mat-form-field appearance="outline"><mat-label>{{ 'repairs.quantity' | transloco }}</mat-label><input matInput type="number" [formControl]="partQuantity"></mat-form-field>@if(products().length > 1){<mat-form-field appearance="outline" floatLabel="always"><mat-label>{{'repairs.selectPart'|transloco}}</mat-label><mat-select [value]="selectedPart()" (valueChange)="selectedPart.set($event)">@for(p of products();track p.id){<mat-option [value]="p.id">{{p.name}} &#183; {{p.sku}}</mat-option>}</mat-select></mat-form-field>}<button mat-flat-button [disabled]="current.status==='DELIVERED'||current.status==='CANCELLED'" (click)="addPart()">{{ 'common.add' | transloco }}</button></div></section>
      <section class="info-card totals-box"><h2>{{ 'repairs.totals' | transloco }}</h2><p>{{ 'repairs.partsTotal' | transloco }}: {{ current.parts_total | money }}</p><mat-form-field appearance="outline"><mat-label>{{ 'repairs.labor' | transloco }}</mat-label><input matInput type="number" [readonly]="current.status==='DELIVERED'||current.status==='CANCELLED'" [formControl]="labor" (blur)="saveLabor()"></mat-form-field><p>{{ 'repairs.total' | transloco }}: <strong>{{ current.total | money }}</strong></p><p>{{ 'repairs.paid' | transloco }}: {{ current.amount_paid | money }}</p><p>{{ 'repairs.balance' | transloco }}: <strong>{{ current.balance | money }}</strong></p><button mat-flat-button color="primary" (click)="pay()" [disabled]="current.balance <= 0">{{ 'repairs.recordPayment' | transloco }}</button></section>
      <section class="info-card"><h2>{{ 'repairs.notes' | transloco }}</h2><textarea [attr.aria-label]="'repairs.notes'|transloco" class="notes" [readonly]="current.status==='DELIVERED'||current.status==='CANCELLED'" [value]="current.technician_notes" (blur)="saveNotes($event)"></textarea>@if (current.status === 'READY') {<button mat-stroked-button (click)="whatsapp()">{{ 'repairs.whatsapp' | transloco }}</button>}@if (current.status === 'DELIVERED') {<button mat-stroked-button (click)="print()">{{ 'repairs.printReceipt' | transloco }}</button>}</section></div></section><button mat-stroked-button class="no-print" (click)="print()">{{'repairs.printSlip'|transloco}}</button></section> } @else { <p>{{ 'common.loading' | transloco }}</p> }
  `,
  styles: [`.status-progress{display:flex;gap:8px;list-style:none;padding:0;margin-block:0 24px;flex-wrap:wrap}.status-progress li{padding:8px 12px;border-radius:24px;background:#e8ecf3;color:#536079}.status-progress .current{background:#3949ab;color:white}.totals-box{position:sticky;inset-block-start:16px;align-self:start}.detail-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; } .info-card { display: grid; gap: 10px; padding: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; } .part-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; border-block-end: 1px solid #edf0f2; padding: 8px 0; } .add-part { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .notes { min-height: 120px; padding: 10px; border: 1px solid #cbd2da; border-radius: 8px; font: inherit; } @media (max-width: 800px) { .detail-grid { grid-template-columns: 1fr; } }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairDetailPageComponent {
  private readonly dialog=inject(MatDialog);
  private readonly i18n=inject(TranslocoService);
  readonly settings=inject(SettingsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly repairsApi = inject(RepairsApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly customersApi = inject(CustomersApi);
  private readonly snackBar = inject(MatSnackBar);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly ticket = signal<RepairTicket | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly selectedPart = signal(0);
  readonly products = signal<Product[]>([]);
  readonly statuses: RepairTicket['status'][] = ['RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'IN_REPAIR', 'READY', 'DELIVERED', 'CANCELLED'];
  readonly partSearch = inject(FormBuilder).nonNullable.control('');
  readonly partQuantity = inject(FormBuilder).nonNullable.control(1, Validators.min(1));
  readonly labor = inject(FormBuilder).nonNullable.control(0, Validators.min(0));
  constructor() { this.load(); }
  load(): void { this.repairsApi.get(this.id).subscribe((ticket) => { this.ticket.set(ticket); this.labor.setValue(ticket.labor_cost); this.customersApi.get(ticket.customer).subscribe((customer) => this.customer.set(customer)); }); }
  changeStatus(status: RepairTicket['status'], control: MatSelect): void { this.repairsApi.status(this.id, status).subscribe({ next: (ticket) => this.ticket.set(ticket), error: () => { control.value=this.ticket()?.status; } }); }
  addPart(): void {
    if(this.partQuantity.invalid || !this.partSearch.value.trim())return;
    this.productsApi.lookup(this.partSearch.value).subscribe(items=>{
      const available=items.filter(p=>!p.track_imei && p.stock_qty>=this.partQuantity.value);
      this.products.set(available);
      const product=available.find(p=>p.id===this.selectedPart()) ?? available.find(p=>p.sku===this.partSearch.value.trim()) ?? (available.length===1?available[0]:undefined);
      if(product)this.repairsApi.addPart(this.id,{product_id:product.id,quantity:this.partQuantity.value,unit_price:product.sell_price}).subscribe(()=>{this.selectedPart.set(0);this.products.set([]);this.load();});
    });
  }
  removePart(partId: number): void { this.repairsApi.removePart(this.id, partId).subscribe(() => this.load()); }
  saveLabor(): void {const ticket=this.ticket();if(!ticket||this.labor.invalid||Number(ticket.labor_cost)===Number(this.labor.value)||['DELIVERED','CANCELLED'].includes(ticket.status))return;this.repairsApi.update(this.id,{labor_cost:this.labor.value}).subscribe(()=>this.load());}
  saveNotes(event:Event):void{const ticket=this.ticket();const value=(event.target as HTMLTextAreaElement).value;if(!ticket||value===ticket.technician_notes||['DELIVERED','CANCELLED'].includes(ticket.status))return;this.repairsApi.update(this.id,{technician_notes:value}).subscribe(updated=>this.ticket.set(updated));}
  pay(): void { const ticket=this.ticket(); if(!ticket)return;this.dialog.open(AmountDialogComponent,{data:{title:'repairs.recordPayment',max:Number(ticket.balance)}}).afterClosed().subscribe(amount=>{if(amount)this.repairsApi.payment(this.id,amount).subscribe(()=>this.load());}); }
  whatsapp(): void {const customer=this.customer();const ticket=this.ticket();if(!customer||!ticket)return;let phone=customer.phone.replace(/\D/g,'');if(!phone)return;const code=this.settings.value()?.country_dial_code??'213';if(phone.startsWith('00'))phone=phone.slice(2);else if(phone.startsWith('0'))phone=code+phone.slice(1);else if(phone.length===9)phone=code+phone;window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`${ticket.number} ${this.i18n.translate('repairs.readyMessage')}`)}`,'_blank','noopener');}
  print(): void { window.print(); }
}
