import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@jsverse/transloco';

import { PhoneUnitsApi, ProductsApi, StockMovementsApi } from '../../../core/api/resource-apis';
import { PhoneUnit, Product, StockMovement } from '../../../core/models/models';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { ReceivePhoneDialogComponent } from './receive-phone-dialog.component';

@Component({
  selector: 'app-phone-product-page',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    DatePipe,
    RouterLink,
    TranslocoPipe,
    MoneyPipe,
  ],
  templateUrl: './phone-product-page.component.html',
  styleUrl: './phone-product-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneProductPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductsApi);
  private readonly unitsApi = inject(PhoneUnitsApi);
  private readonly movementsApi = inject(StockMovementsApi);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productId = Number(this.route.snapshot.paramMap.get('id'));

  readonly product = signal<Product | null>(null);
  readonly units = signal<PhoneUnit[]>([]);
  readonly movements = signal<StockMovement[]>([]);
  readonly status = signal<PhoneUnit['status'] | ''>('');
  readonly loading = signal(true);
  readonly unitColumns = ['imei', 'condition', 'cost', 'price', 'status', 'purchased_at'];
  readonly movementColumns = ['created_at', 'quantity_change', 'reason', 'reference', 'note'];
  readonly statuses: Array<PhoneUnit['status'] | ''> = ['', 'IN_STOCK', 'RESERVED', 'SOLD', 'RETURNED'];

  constructor() {
    this.productsApi.get(this.productId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (product) => this.product.set(product),
      error: () => this.loading.set(false),
    });
    this.loadUnits();
    this.movementsApi.byProduct(this.productId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => this.movements.set(page.results),
    });
  }

  loadUnits(): void {
    this.loading.set(true);
    this.unitsApi.byProduct(this.productId, this.status() || undefined).subscribe({
      next: (page) => {
        this.units.set(page.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(status: PhoneUnit['status'] | ''): void {
    this.status.set(status);
    this.loadUnits();
  }

  receivePhone(): void {
    const product = this.product();
    if (!product) return;
    this.dialog.open(ReceivePhoneDialogComponent, {
      width: 'min(42rem, calc(100vw - 2rem))',
      data: { product },
    }).afterClosed().subscribe((saved: boolean | undefined) => {
      if (saved) {
        this.productsApi.get(this.productId).subscribe((updated) => this.product.set(updated));
        this.loadUnits();
        this.movementsApi.byProduct(this.productId).subscribe((page) => this.movements.set(page.results));
      }
    });
  }
}
