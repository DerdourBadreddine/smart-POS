import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-placeholder-page',
  imports: [TranslocoPipe],
  template: `
    <section class="placeholder-page">
      <span class="eyebrow">{{ 'common.workspace' | transloco }}</span>
      <h1>{{ titleKey | transloco }}</h1>
      <p>{{ 'common.phaseComingSoon' | transloco }}</p>
    </section>
  `,
  styles: `
    .placeholder-page {
      display: grid;
      align-content: center;
      min-block-size: 60vh;
      gap: 0.75rem;
      text-align: start;
    }
    .eyebrow {
      color: var(--mat-sys-primary);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    h1, p { margin: 0; }
    p { color: var(--mat-sys-on-surface-variant); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly titleKey = this.route.snapshot.data['titleKey'] as string;
}
