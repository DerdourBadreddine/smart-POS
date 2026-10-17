import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '../../../core/i18n/bundled-transloco.pipe';

import { PhoneUnitsApi } from '../../../core/api/resource-apis';
import { PhoneUnit, Product } from '../../../core/models/models';
import { imeiValidator } from '../../../shared/validators/imei.validator';

@Component({
  selector: 'app-receive-phone-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './receive-phone-dialog.component.html',
  styleUrl: './receive-phone-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceivePhoneDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PhoneUnitsApi);
  private readonly ref = inject(MatDialogRef<ReceivePhoneDialogComponent>);

  readonly data: { product: Product };
  readonly form;
  saving = false;

  constructor(@Inject(MAT_DIALOG_DATA) data: { product: Product }) {
    this.data = data;
    this.form = this.fb.nonNullable.group({
      product: [data.product.id],
      imei: ['', [Validators.required, imeiValidator()]],
      condition: ['NEW', Validators.required],
      cost_price: [data.product.cost_price, [Validators.required, Validators.min(0)]],
      sell_price: [data.product.sell_price, [Validators.required, Validators.min(0)]],
      purchased_at: [new Date().toISOString().slice(0, 10), Validators.required],
      supplier: [''],
      notes: [''],
    });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const value = this.form.getRawValue();
    const payload: Partial<PhoneUnit> = {
      ...value,
      condition: value.condition as PhoneUnit['condition'],
    };
    this.api.create(payload).subscribe({
      next: () => this.ref.close(true),
      error: () => (this.saving = false),
    });
  }
}
