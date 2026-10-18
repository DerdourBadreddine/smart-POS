import { TranslocoService } from '@jsverse/transloco';
import { fieldErrors } from '../../../core/interceptors/error.interceptor';
import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '../../../core/i18n/bundled-transloco.pipe';

import { ProductsApi } from '../../../core/api/resource-apis';
import { Category, Product } from '../../../core/models/models';

interface ProductDialogData {
  product?: Product;
  categories: Category[];
}

@Component({
  selector: 'app-product-form-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrl: './product-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormDialogComponent {
  private readonly i18n = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProductsApi);
  private readonly ref = inject(MatDialogRef<ProductFormDialogComponent>);

  readonly data: ProductDialogData;
  readonly form;
  saving = false;
  serverError = '';

  constructor(@Inject(MAT_DIALOG_DATA) data: ProductDialogData) {
    this.data = data;
    const product = data.product;
    this.form = this.fb.nonNullable.group({
      name: [product?.name ?? '', [Validators.required, Validators.maxLength(200)]],
      sku: [product?.sku ?? '', [Validators.required, Validators.maxLength(64)]],
      category: [product?.category ?? data.categories[0]?.id ?? 0, Validators.required],
      brand: [product?.brand ?? ''],
      model_name: [product?.model_name ?? ''],
      cost_price: [product?.cost_price ?? 0, [Validators.required, Validators.min(0)]],
      sell_price: [product?.sell_price ?? 0, [Validators.required, Validators.min(0)]],
      track_imei: [product?.track_imei ?? false],
      stock_qty: [product?.stock_qty ?? 0, [Validators.required, Validators.min(0)]],
      low_stock_threshold: [product?.low_stock_threshold ?? 2, [Validators.required, Validators.min(0)]],
      warranty_days: [product?.warranty_days ?? 0, [Validators.required, Validators.min(0)]],
      is_active: [product?.is_active ?? true],
    });
  }

  selectedCategory(): Category | undefined {
    return this.data.categories.find((category) => category.id === this.form.controls.category.value);
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.serverError = '';
    const payload = this.form.getRawValue();
    const request = this.data.product
      ? this.api.update(this.data.product.id, payload)
      : this.api.create(payload);
    request.subscribe({
      next: () => this.ref.close(true),
      error: (error: { error?: { detail?: string } }) => {
        this.saving = false;
        this.serverError = fieldErrors(error.error) || this.i18n.translate('errors.request');
      },
    });
  }
}
