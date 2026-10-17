import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CategoriesApi, ProductsApi } from '../../../core/api/resource-apis';
import { Category, Page, Product } from '../../../core/models/models';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { ProductFormDialogComponent } from './product-form-dialog.component';
import { StockAdjustmentDialogComponent } from './stock-adjustment-dialog.component';

type ProductKind = Category['kind'] | 'ALL';

@Component({
  selector: 'app-products-page',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    MatTabsModule,
    ReactiveFormsModule,
    MoneyPipe,
    TranslocoPipe,
  ],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent {
  private readonly productsApi = inject(ProductsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly selectedKind = signal<ProductKind>('ALL');
  readonly onlyLowStock = signal(false);
  readonly activeOnly = signal(true);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly displayedColumns = ['name', 'sku', 'category', 'stock', 'cost', 'price', 'actions'];
  readonly tabKinds: ProductKind[] = ['ALL', 'PHONE', 'ACCESSORY', 'PART'];

  constructor() {
    this.categoriesApi
      .list({ page_size: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((page: Page<Category>) => this.categories.set(page.results));

    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadProducts();
      });

    this.loadProducts();
  }

  selectKind(kind: ProductKind): void {
    this.selectedKind.set(kind);
    this.pageIndex.set(0);
    this.loadProducts();
  }

  selectTab(index: number): void {
    this.selectKind(this.tabKinds[index] ?? 'ALL');
  }

  toggleLowStock(): void {
    this.onlyLowStock.update((value) => !value);
    this.pageIndex.set(0);
    this.loadProducts();
  }

  toggleActive(): void {
    this.activeOnly.update((value) => !value);
    this.pageIndex.set(0);
    this.loadProducts();
  }

  changePage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  openCreate(): void {
    this.dialog
      .open(ProductFormDialogComponent, {
        width: 'min(42rem, calc(100vw - 2rem))',
        data: { categories: this.categories() },
      })
      .afterClosed()
      .subscribe((saved: boolean | undefined) => {
        if (saved) this.loadProducts();
      });
  }

  openEdit(product: Product): void {
    this.dialog
      .open(ProductFormDialogComponent, {
        width: 'min(42rem, calc(100vw - 2rem))',
        data: { product, categories: this.categories() },
      })
      .afterClosed()
      .subscribe((saved: boolean | undefined) => {
        if (saved) this.loadProducts();
      });
  }

  openAdjustment(product: Product): void {
    this.dialog
      .open(StockAdjustmentDialogComponent, {
        width: 'min(32rem, calc(100vw - 2rem))',
        data: { product },
      })
      .afterClosed()
      .subscribe((saved: boolean | undefined) => {
        if (saved) this.loadProducts();
      });
  }

  categoryName(product: Product): string {
    return product.category_name || this.categories().find((category) => category.id === product.category)?.name || '';
  }

  loadProducts(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      page: this.pageIndex() + 1,
      page_size: this.pageSize(),
      search: this.search.value.trim(),
      is_active: this.activeOnly(),
      low_stock: this.onlyLowStock(),
    };
    if (this.selectedKind() !== 'ALL') {
      params['category__kind'] = this.selectedKind();
    }
    this.productsApi.list(params).subscribe({
      next: (page) => {
        this.products.set(page.results);
        this.total.set(page.count);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
