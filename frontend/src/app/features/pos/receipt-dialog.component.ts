import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';
import { Sale } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-receipt-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MoneyPipe, TranslocoPipe],
  template: `
    <div class="receipt" id="print-receipt">
      <h2>{{ 'pos.receipt' | transloco }}</h2><p>{{ data.number }} · {{ data.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
      @for (item of data.items; track item.id) { <div class="receipt-line"><span>{{ item.description }} × {{ item.quantity }}</span><strong>{{ item.line_total | money }}</strong></div> }
      <hr /><div class="receipt-line"><span>{{ 'pos.total' | transloco }}</span><strong>{{ data.total | money }}</strong></div>
      @if (data.balance > 0) { <div class="receipt-line"><span>{{ 'pos.remainingCredit' | transloco }}</span><strong>{{ data.balance | money }}</strong></div> }
    </div>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.close' | transloco }}</button><button mat-flat-button color="primary" (click)="print()">{{ 'pos.print' | transloco }}</button></mat-dialog-actions>
  `,
  styles: [`.receipt { min-width: min(24rem, 70vw); padding: 8px; } .receipt-line { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; } h2, p { text-align: center; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) readonly data: Sale) {}
  print(): void { window.print(); }
}
