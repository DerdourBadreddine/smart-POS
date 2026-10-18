import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';
import { Sale } from '../../core/models/models';
import { SettingsStore } from '../../core/stores/settings.store';
import { LanguageService } from '../../core/i18n/language.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-receipt-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MoneyPipe, TranslocoPipe],
  template: `
    <div class="receipt" id="print-receipt" [attr.dir]="language.language() === 'ar' ? 'rtl' : 'ltr'">
      <h2>{{ settings.shopName() }}</h2><p>{{ settings.value()?.address }}<br>{{ settings.value()?.phone }}</p>
      <h2>{{ 'pos.receipt' | transloco }}</h2><p>{{ data.number }} · {{ data.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
      @for (item of data.items; track item.id) { <div class="receipt-line"><span>{{ item.description }} × {{ item.quantity }}</span><strong>{{ item.line_total | money }}</strong></div>@if(item.phone_unit){<small>{{ 'common.imei' | transloco }}: {{ item.imei || item.phone_unit }}</small>}@if(item.warranty_until){<small>{{ 'pos.warranty' | transloco }} {{ item.warranty_until | date:'dd/MM/yyyy' }}</small>} }
      <hr /><div class="receipt-line"><span>{{ 'pos.subtotal' | transloco }}</span><strong>{{ data.subtotal | money }}</strong></div><div class="receipt-line"><span>{{ 'pos.discount' | transloco }}</span><strong>{{ data.discount | money }}</strong></div><div class="receipt-line"><span>{{ 'pos.total' | transloco }}</span><strong>{{ data.total | money }}</strong></div>
      @if (data.balance > 0) { <div class="receipt-line"><span>{{ 'pos.remainingCredit' | transloco }}</span><strong>{{ data.balance | money }}</strong></div> }
      <div class="receipt-line"><span>{{ 'sales.paid' | transloco }}</span><strong>{{ data.paid_total | money }}</strong></div><p>{{ language.language() === 'fr' ? settings.value()?.receipt_footer_fr : settings.value()?.receipt_footer_ar }}</p>
    </div>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.close' | transloco }}</button><button mat-flat-button color="primary" (click)="print()">{{ 'pos.print' | transloco }}</button></mat-dialog-actions>
  `,
  styles: [`small{display:block;margin-block:4px;overflow-wrap:anywhere}.receipt { min-width: min(24rem, 70vw); padding: 8px; } .receipt-line { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; } h2, p { text-align: center; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptDialogComponent {
  readonly settings = inject(SettingsStore);
  readonly language = inject(LanguageService);
  constructor(@Inject(MAT_DIALOG_DATA) readonly data: Sale) {}
  print(): void { window.print(); }
}
