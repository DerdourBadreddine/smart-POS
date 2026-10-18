import { ChangeDetectionStrategy, Component, Injectable, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '../core/i18n/bundled-transloco.pipe';

@Component({ selector: 'app-page-header', imports: [TranslocoPipe], template: `<header class="page-header"><div><span class="eyebrow">{{ eyebrow() | transloco }}</span><h1>{{ title() | transloco }}</h1>@if(subtitle()){<p>{{ subtitle() | transloco }}</p>}</div><div class="header-actions"><ng-content /></div></header>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class PageHeaderComponent { readonly title = input.required<string>(); readonly eyebrow = input(''); readonly subtitle = input(''); }

@Component({ selector: 'app-empty-state', imports: [MatIconModule, TranslocoPipe], template: `<div class="empty-state" role="status"><mat-icon>{{ icon() }}</mat-icon><p>{{ message() | transloco }}</p><ng-content /></div>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class EmptyStateComponent { readonly message = input('common.noResults'); readonly icon = input('inbox'); }

@Component({ selector: 'app-kpi-card', imports: [MatIconModule, TranslocoPipe], template: `<article><div class="kpi-label"><span>{{ label() | transloco }}</span><mat-icon>{{ icon() }}</mat-icon></div><strong><ng-content /></strong>@if(hint()){<small>{{ hint() }}</small>}</article>`, styles: [`:host{min-inline-size:0}article{background:white;border:1px solid var(--mat-sys-outline-variant);border-radius:16px;padding:20px;min-block-size:144px;block-size:100%;display:flex;flex-direction:column;gap:16px;box-shadow:var(--app-shadow)}.kpi-label{display:flex;justify-content:space-between;align-items:center;gap:8px;color:var(--mat-sys-on-surface-variant);font-size:13px}.kpi-label mat-icon{color:var(--mat-sys-primary);flex-shrink:0}strong{font-size:clamp(20px,1.8vw,28px);letter-spacing:-.03em;white-space:nowrap}small{color:var(--mat-sys-on-surface-variant);margin-block-start:auto}`], changeDetection: ChangeDetectionStrategy.OnPush })
export class KpiCardComponent { readonly label = input.required<string>(); readonly icon = input('payments'); readonly hint = input(''); }

@Component({ selector: 'app-confirm-dialog', imports: [MatButtonModule, MatDialogModule, TranslocoPipe], template: `<h2 mat-dialog-title>{{ data | transloco }}</h2><mat-dialog-actions align="end"><button mat-button [mat-dialog-close]="false">{{ 'common.cancel' | transloco }}</button><button mat-flat-button [mat-dialog-close]="true">{{ 'common.confirm' | transloco }}</button></mat-dialog-actions>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class ConfirmDialogComponent { readonly data = inject<string>(MAT_DIALOG_DATA); }

@Injectable({ providedIn: 'root' })
export class ConfirmService { private readonly dialog = inject(MatDialog); open(key: string) { return this.dialog.open(ConfirmDialogComponent, { data: key, width: '420px' }).afterClosed(); } }

@Component({ selector: 'app-amount-dialog', imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, TranslocoPipe], template: `<h2 mat-dialog-title>{{ data.title | transloco }}</h2><mat-dialog-content><mat-form-field appearance="outline"><mat-label>{{ 'customers.paymentAmount' | transloco }}</mat-label><input matInput type="number" [formControl]="amount" min="0.01" [max]="data.max" step="0.01">@if(amount.invalid){<mat-error>{{ 'errors.invalid' | transloco }}</mat-error>}</mat-form-field>@if(data.hint){<p>{{ data.hint | transloco }}</p>}</mat-dialog-content><mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.cancel' | transloco }}</button><button mat-flat-button [disabled]="amount.invalid" (click)="save()">{{ 'common.confirm' | transloco }}</button></mat-dialog-actions>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class AmountDialogComponent { readonly data = inject<{ title: string; max: number; hint?: string }>(MAT_DIALOG_DATA); private readonly ref = inject(MatDialogRef<AmountDialogComponent>); readonly amount = new FormControl(Number(this.data.max), { nonNullable: true, validators: [Validators.required, Validators.min(0.01), Validators.max(Number(this.data.max))] }); save() { if(this.amount.valid) this.ref.close(this.amount.value); } }
