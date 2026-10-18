import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';
import { DevicesApi, SalesApi } from '../../core/api/resource-apis';
import { DeviceHistory } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { imeiValidator } from '../../shared/validators/imei.validator';
import { ReceiptDialogComponent } from '../pos/receipt-dialog.component';
@Component({selector:'app-device-lookup-page',imports:[DatePipe,MoneyPipe,MatButtonModule,MatIconModule,MatFormFieldModule,MatInputModule,MatProgressBarModule,ReactiveFormsModule,RouterLink,TranslocoPipe],template:`
<section class="page"><header class="page-header"><div><span class="eyebrow">{{'devices.title'|transloco}}</span><h1>{{'devices.lookup'|transloco}}</h1></div></header>
<form class="lookup" [formGroup]="form" (ngSubmit)="lookup()"><mat-form-field appearance="outline"><mat-label>{{'common.imei'|transloco}}</mat-label><input matInput formControlName="imei" maxlength="15" inputmode="numeric">@if(form.controls.imei.hasError('required')){<mat-error>{{'common.required'|transloco}}</mat-error>}@else if(form.controls.imei.hasError('imeiFormat')){<mat-error>{{'inventory.imeiFormat'|transloco}}</mat-error>}@else{<mat-error>{{'inventory.imeiChecksum'|transloco}}</mat-error>}</mat-form-field><button mat-flat-button>{{'common.search'|transloco}}</button></form>
@if(loading()){<mat-progress-bar mode="indeterminate"/>}
@if(history();as result){<section class="result-card"><div class="banner" [class.good]="result.warranty.active">{{(result.warranty.active?'devices.underWarranty':'devices.noWarranty')|transloco}} {{result.warranty.ends_on|date:'dd/MM/yyyy'}}</div><h2>{{'devices.timeline'|transloco}}</h2>
@if(result.phone_unit;as unit){<div class="timeline-row"><mat-icon>smartphone</mat-icon><div><strong>{{unit.product.name}}</strong><p>{{'inventory.purchaseDate'|transloco}}: {{unit.purchased_at|date:'dd/MM/yyyy'}} &#183; {{('status.'+unit.status)|transloco}}</p></div></div>}
@for(sale of result.sales;track sale.id){<div class="timeline-row"><mat-icon>shopping_bag</mat-icon><button mat-button (click)="receipt(sale.id)">{{sale.number}}</button><span>{{sale.date|date:'dd/MM/yyyy'}}</span><strong>{{sale.price|money}}</strong></div>}
@for(repair of result.repairs;track repair.id){<div class="timeline-row"><mat-icon>build</mat-icon><a mat-button [routerLink]="['/repairs',repair.id]">{{repair.number}}</a><span>{{repair.received_at|date:'dd/MM/yyyy'}}</span><span class="status-chip">{{('repairs.statuses.'+repair.status)|transloco}}</span></div>}
</section>}
@if(searched()&&!history()){<div class="empty-state"><p>{{'devices.unknown'|transloco}}</p><a mat-stroked-button routerLink="/inventory" [queryParams]="{kind:'PHONE',imei:form.controls.imei.value}">{{'inventory.receivePhone'|transloco}}</a><a mat-stroked-button routerLink="/repairs/new" [queryParams]="{imei:form.controls.imei.value}">{{'devices.newRepair'|transloco}}</a></div>}
</section>`,styles:[`.lookup{display:flex;gap:16px;align-items:center}.result-card,.empty-state{padding:24px;background:white;border:1px solid #dce2ec;border-radius:16px}.banner{padding:16px;background:#fee2e2;color:#991b1b;font-weight:600;border-radius:12px}.banner.good{background:#dcfce7;color:#166534}.timeline-row{display:flex;align-items:center;gap:16px;padding-block:16px;border-block-end:1px solid #dce2ec;flex-wrap:wrap}.timeline-row p{margin-block:8px 0;color:#536079}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class DeviceLookupPageComponent{
 private readonly api=inject(DevicesApi);private readonly sales=inject(SalesApi);private readonly dialog=inject(MatDialog);
 readonly form=inject(FormBuilder).nonNullable.group({imei:['',[Validators.required,imeiValidator()]]});readonly history=signal<DeviceHistory|null>(null);readonly loading=signal(false);readonly searched=signal(false);
 lookup(){if(this.form.invalid){this.form.markAllAsTouched();return;}this.loading.set(true);this.searched.set(true);this.api.lookup(this.form.controls.imei.value).subscribe({next:value=>{this.history.set(value.phone_unit||value.sales.length||value.repairs.length?value:null);this.loading.set(false);},error:()=>{this.history.set(null);this.loading.set(false);}});}
 receipt(id:number){this.sales.get(id).subscribe(sale=>this.dialog.open(ReceiptDialogComponent,{data:sale,width:'440px'}));}
}
