import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslocoPipe } from '@jsverse/transloco';
import { CustomersApi, RepairsApi } from '../../core/api/resource-apis';
import { Customer, Page, RepairTicket } from '../../core/models/models';
import { imeiValidator } from '../../shared/validators/imei.validator';

@Component({
  selector: 'app-repair-form-page',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, ReactiveFormsModule, TranslocoPipe],
  template: `
    <section class="page form-page"><header class="page-header"><div><span class="eyebrow">{{ 'repairs.title' | transloco }}</span><h1>{{ 'repairs.newTicket' | transloco }}</h1></div></header>
    <form class="form-card" [formGroup]="form" (ngSubmit)="save()">
      <mat-form-field appearance="outline"><mat-label>{{ 'repairs.customer' | transloco }}</mat-label><mat-select formControlName="customer"><mat-option value="">{{ 'repairs.selectCustomer' | transloco }}</mat-option>@for (customer of customers(); track customer.id) {<mat-option [value]="customer.id">{{ customer.name }} · {{ customer.phone }}</mat-option>}</mat-select></mat-form-field>
      <div class="two-col"><mat-form-field appearance="outline"><mat-label>{{ 'repairs.brand' | transloco }}</mat-label><input matInput formControlName="device_brand"></mat-form-field><mat-form-field appearance="outline"><mat-label>{{ 'repairs.model' | transloco }}</mat-label><input matInput formControlName="device_model"></mat-form-field></div>
      <mat-form-field appearance="outline"><mat-label>IMEI</mat-label><input matInput formControlName="imei" maxlength="15" inputmode="numeric"></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>{{ 'repairs.issue' | transloco }}</mat-label><textarea matInput rows="3" formControlName="issue_description"></textarea></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>{{ 'repairs.accessories' | transloco }}</mat-label><input matInput formControlName="accessories_left"></mat-form-field>
      <div class="two-col"><mat-form-field appearance="outline"><mat-label>{{ 'repairs.estimatedCost' | transloco }}</mat-label><input matInput type="number" formControlName="estimated_cost"></mat-form-field><mat-form-field appearance="outline"><mat-label>{{ 'repairs.deposit' | transloco }}</mat-label><input matInput type="number" formControlName="deposit_paid"></mat-form-field></div>
      <div class="two-col"><mat-form-field appearance="outline"><mat-label>{{ 'repairs.promisedDate' | transloco }}</mat-label><input matInput type="date" formControlName="promised_date"></mat-form-field><mat-form-field appearance="outline"><mat-label>{{ 'repairs.warrantyDays' | transloco }}</mat-label><input matInput type="number" formControlName="warranty_days"></mat-form-field></div>
      <div class="form-actions"><button mat-button type="button" (click)="router.navigate(['/repairs'])">{{ 'common.cancel' | transloco }}</button><button mat-flat-button color="primary" type="submit">{{ 'common.save' | transloco }}</button></div>
    </form></section>
  `,
  styles: [`.form-card { max-width: 52rem; display: grid; gap: 12px; padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; } .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .form-actions { display: flex; justify-content: flex-end; gap: 8px; } @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customersApi = inject(CustomersApi);
  private readonly repairsApi = inject(RepairsApi);
  private readonly snackBar = inject(MatSnackBar);
  readonly router = inject(Router);
  readonly customers = signal<Customer[]>([]);
  readonly form = this.fb.nonNullable.group({
    customer: ['', Validators.required], device_brand: ['', Validators.required], device_model: ['', Validators.required],
    imei: ['', imeiValidator()], issue_description: ['', Validators.required], accessories_left: [''],
    estimated_cost: [0, [Validators.required, Validators.min(0)]], deposit_paid: [0, [Validators.required, Validators.min(0)]],
    promised_date: [''], warranty_days: [0, [Validators.required, Validators.min(0)]],
  });
  constructor() {
    this.customersApi.list({ page_size: 100, ordering: 'name' }).subscribe((page: Page<Customer>) => this.customers.set(page.results));
    const imei = inject(ActivatedRoute).snapshot.queryParamMap.get('imei');
    if (imei) this.form.controls.imei.setValue(imei);
  }
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.repairsApi.create({ ...value, customer: Number(value.customer) }).subscribe({
      next: (ticket) => { this.snackBar.open(this.translated('repairs.created'), 'OK', { duration: 3000 }); window.print(); this.router.navigate(['/repairs', ticket.id]); },
    });
  }
  private translated(key: string): string { return key === 'repairs.created' ? 'Ticket créé' : key; }
}
