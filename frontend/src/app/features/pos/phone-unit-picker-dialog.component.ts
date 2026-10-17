import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { TranslocoPipe } from '@jsverse/transloco';

import { PhoneUnitsApi } from '../../core/api/resource-apis';
import { PhoneUnit, Product } from '../../core/models/models';

@Component({
  selector: 'app-phone-unit-picker-dialog',
  imports: [MatButtonModule, MatDialogModule, MatProgressBarModule, MatTableModule, TranslocoPipe],
  template: `
    <h2 mat-dialog-title>{{ 'pos.choosePhone' | transloco }}</h2>
    <mat-dialog-content>
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
      <table mat-table [dataSource]="units()">
        <ng-container matColumnDef="imei"><th mat-header-cell *matHeaderCellDef>IMEI</th><td mat-cell *matCellDef="let unit">{{ unit.imei }}</td></ng-container>
        <ng-container matColumnDef="price"><th mat-header-cell *matHeaderCellDef>{{ 'pos.price' | transloco }}</th><td mat-cell *matCellDef="let unit">{{ unit.sell_price }}</td></ng-container>
        <ng-container matColumnDef="action"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let unit"><button mat-flat-button color="primary" (click)="select(unit)">{{ 'common.select' | transloco }}</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
      @if (!loading() && units().length === 0) { <p>{{ 'pos.noPhones' | transloco }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.cancel' | transloco }}</button></mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneUnitPickerDialogComponent {
  private readonly api = inject(PhoneUnitsApi);
  private readonly ref = inject(MatDialogRef<PhoneUnitPickerDialogComponent>);
  readonly units = signal<PhoneUnit[]>([]);
  readonly loading = signal(true);
  readonly columns = ['imei', 'price', 'action'];
  readonly data: { product: Product };

  constructor(@Inject(MAT_DIALOG_DATA) data: { product: Product }) {
    this.data = data;
    this.api.byProduct(data.product.id, 'IN_STOCK').subscribe({
      next: (page) => { this.units.set(page.results); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  select(unit: PhoneUnit): void { this.ref.close(unit); }
}
