import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '../../../core/i18n/bundled-transloco.pipe';

import { ProductsApi } from '../../../core/api/resource-apis';
import { Product } from '../../../core/models/models';

@Component({
  selector: 'app-stock-adjustment-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './stock-adjustment-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockAdjustmentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProductsApi);
  private readonly ref = inject(MatDialogRef<StockAdjustmentDialogComponent>);

  readonly form = this.fb.nonNullable.group({
    delta: [0, [Validators.required, Validators.min(-100000)]],
    reason: ['ADJUSTMENT', Validators.required],
    note: [''],
  });
  readonly data: { product: Product };
  saving = false;

  constructor(@Inject(MAT_DIALOG_DATA) data: { product: Product }) {
    this.data = data;
  }

  save(): void {
    if (this.form.invalid || this.form.controls.delta.value === 0 || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.api.adjustStock(this.data.product.id, this.form.getRawValue()).subscribe({
      next: () => this.ref.close(true),
      error: () => (this.saving = false),
    });
  }
}
