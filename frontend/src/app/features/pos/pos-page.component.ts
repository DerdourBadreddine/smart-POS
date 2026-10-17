import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoPipe } from '../../core/i18n/bundled-transloco.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { PhoneUnitsApi, ProductsApi, SalesApi } from '../../core/api/resource-apis';
import { Product, Sale } from '../../core/models/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { CartStore } from './cart.store';
import { PaymentDialogComponent, PaymentResult } from './payment-dialog.component';
import { PhoneUnitPickerDialogComponent } from './phone-unit-picker-dialog.component';

@Component({
  selector: 'app-pos-page',
  providers: [CartStore],
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSnackBarModule, MoneyPipe, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './pos-page.component.html',
  styleUrl: './pos-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPageComponent {
  private readonly productsApi = inject(ProductsApi);
  private readonly phoneUnitsApi = inject(PhoneUnitsApi);
  private readonly salesApi = inject(SalesApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);
  readonly cart = inject(CartStore);
  readonly search = new FormControl('', { nonNullable: true });
  readonly results = signal<Product[]>([]);
  readonly searching = signal(false);
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor() {
    this.search.valueChanges.pipe(debounceTime(250), distinctUntilChanged()).subscribe((query) => this.lookup(query));
  }

  lookup(query: string): void {
    const value = query.trim();
    if (!value) { this.results.set([]); return; }
    this.searching.set(true);
    this.productsApi.lookup(value).subscribe({
      next: (products) => { this.results.set(products); this.searching.set(false); },
      error: () => this.searching.set(false),
    });
  }

  addProduct(product: Product): void {
    if (product.track_imei) {
      this.dialog.open(PhoneUnitPickerDialogComponent, { width: 'min(48rem, calc(100vw - 2rem))', data: { product } })
        .afterClosed().subscribe((unit) => { if (unit) this.cart.addPhone(product, unit); });
    } else {
      this.cart.addProduct(product);
    }
    this.search.setValue('');
    this.searchInput?.nativeElement.focus();
  }

  addExactMatch(): void {
    const match = this.results().find((product) => product.matched_phone_unit_id);
    if (!match?.matched_phone_unit_id) return;
    this.phoneUnitsApi.get(match.matched_phone_unit_id).subscribe((unit) => {
      this.cart.addPhone(match, unit);
      this.search.setValue('');
      this.searchInput?.nativeElement.focus();
    });
  }

  updatePrice(key: string, event: Event): void {
    this.cart.setPrice(key, Number((event.target as HTMLInputElement).value));
  }

  updateDiscount(event: Event): void {
    this.cart.discount.set(Math.max(0, Number((event.target as HTMLInputElement).value)));
  }

  openPayment(): void {
    if (!this.cart.lines().length) return;
    this.dialog.open(PaymentDialogComponent, { width: 'min(34rem, calc(100vw - 2rem))', data: { total: this.cart.total() } })
      .afterClosed().subscribe((payment: PaymentResult | undefined) => { if (payment) this.completeSale(payment); });
  }

  completeSale(payment: PaymentResult): void {
    const items = this.cart.lines().map((line) => ({
      product_id: line.productId,
      ...(line.phoneUnitId ? { phone_unit_id: line.phoneUnitId } : {}),
      quantity: line.quantity,
      unit_price: line.unitPrice,
    }));
    this.salesApi.createSale({ items, customer_id: payment.customerId, discount: this.cart.discount(), payment_method: payment.paymentMethod, amount_paid: payment.amountPaid }).subscribe({
      next: (sale) => {
        this.snackBar.open(`${sale.number} ${this.transloco.translate('pos.saleCompleted')}`, 'OK', { duration: 4000 });
        this.cart.clear();
        this.search.setValue('');
      },
    });
  }

  @HostListener('window:keydown', ['$event'])
  shortcuts(event: KeyboardEvent): void {
    if (event.key === 'F2') { event.preventDefault(); this.searchInput?.nativeElement.focus(); }
    if (event.key === 'F9') { event.preventDefault(); this.openPayment(); }
    if (event.key === 'Escape' && this.cart.lines().length) {
      if (window.confirm(this.transloco.translate('pos.clearCartConfirm'))) this.cart.clear();
    }
  }
}
