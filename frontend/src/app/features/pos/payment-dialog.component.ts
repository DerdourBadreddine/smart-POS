import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';

import { CustomersApi } from '../../core/api/resource-apis';
import { Customer, Sale } from '../../core/models/models';
import { Page } from '../../core/models/models';

export interface PaymentResult {
  customerId: number | null;
  paymentMethod: Sale['payment_method'];
  amountPaid: number;
  tendered: number;
}

@Component({
  selector: 'app-payment-dialog',
  imports: [MoneyPipe, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customersApi = inject(CustomersApi);
  private readonly ref = inject(MatDialogRef<PaymentDialogComponent>);
  readonly data: { total: number };
  readonly customers = signal<Customer[]>([]);
  readonly form;

  constructor(@Inject(MAT_DIALOG_DATA) data: { total: number }) {
    this.data = data;
    this.form = this.fb.nonNullable.group({
      customerId: [0],
      paymentMethod: ['CASH' as Sale['payment_method'], Validators.required],
      amountPaid: [data.total, [Validators.required, Validators.min(0)]],
    });
    this.customersApi.all({ ordering: 'name' }).subscribe(customers => this.customers.set(customers));
  }

  remaining(): number { return Math.max(0, this.data.total - Number(this.form.controls.amountPaid.value || 0)); }
  change(): number { return Math.max(0, Number(this.form.controls.amountPaid.value || 0) - this.data.total); }
  submit(): void {
    const amount = Number(this.form.controls.amountPaid.value);
    const customerId = this.form.controls.customerId.value || null;
    if (this.form.invalid || (amount < this.data.total && !customerId)) {
      this.form.markAllAsTouched();
      return;
    }
    this.ref.close({ customerId, paymentMethod: this.form.controls.paymentMethod.value, amountPaid: Math.min(amount, this.data.total), tendered: amount } satisfies PaymentResult);
  }
}
