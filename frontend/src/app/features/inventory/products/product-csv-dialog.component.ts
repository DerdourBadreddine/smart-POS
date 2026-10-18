import { TranslocoService } from '@jsverse/transloco';
import { fieldErrors } from '../../../core/interceptors/error.interceptor';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { TranslocoPipe } from '../../../core/i18n/bundled-transloco.pipe';

import { ProductsApi } from '../../../core/api/resource-apis';
import { ProductImportResult } from '../../../core/models/models';

@Component({
  selector: 'app-product-csv-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    TranslocoPipe,
  ],
  templateUrl: './product-csv-dialog.component.html',
  styleUrl: './product-csv-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCsvDialogComponent {
  private readonly i18n = inject(TranslocoService);
  private readonly api = inject(ProductsApi);
  private readonly ref = inject(MatDialogRef<ProductCsvDialogComponent>);

  readonly selectedFile = signal<File | null>(null);
  readonly result = signal<ProductImportResult | null>(null);
  readonly checking = signal(false);
  readonly importing = signal(false);
  readonly error = signal('');
  readonly errorColumns = ['line', 'error'];

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.result.set(null);
    this.error.set('');
  }

  downloadTemplate(): void {
    const header = 'sku,name,category,brand,model_name,cost_price,sell_price,stock_qty,low_stock_threshold,warranty_days';
    const blob = new Blob([`\ufeff${header}\r\n`], { type: 'text/csv;charset=utf-8' });
    this.download(blob, 'products-template.csv');
  }

  checkFile(): void {
    const file = this.selectedFile();
    if (!file || this.checking()) return;
    this.checking.set(true);
    this.error.set('');
    this.api.importCsv(file, true).subscribe({
      next: (result) => {
        this.result.set(result);
        this.checking.set(false);
      },
      error: (error: { error?: { detail?: string } }) => {
        this.error.set(fieldErrors(error.error) || this.i18n.translate('errors.request'));
        this.checking.set(false);
      },
    });
  }

  importFile(): void {
    const file = this.selectedFile();
    const result = this.result();
    if (!file || !result || result.errors.length > 0 || this.importing()) return;
    this.importing.set(true);
    this.error.set('');
    this.api.importCsv(file, false).subscribe({
      next: () => this.ref.close(true),
      error: (error: { error?: { detail?: string } }) => {
        this.error.set(fieldErrors(error.error) || this.i18n.translate('errors.request'));
        this.importing.set(false);
      },
    });
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
