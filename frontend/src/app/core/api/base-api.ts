import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Page } from '../models/models';

export abstract class BaseApi<T> {
  protected readonly http = inject(HttpClient);

  protected constructor(private readonly resource: string) {}

  list(params: Record<string, string | number | boolean> = {}): Observable<Page<T>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<Page<T>>(`/api/${this.resource}/`, { params: httpParams });
  }

  get(id: number): Observable<T> {
    return this.http.get<T>(`/api/${this.resource}/${id}/`);
  }

  create(payload: Partial<T>): Observable<T> {
    return this.http.post<T>(`/api/${this.resource}/`, payload);
  }

  update(id: number, payload: Partial<T>): Observable<T> {
    return this.http.put<T>(`/api/${this.resource}/${id}/`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`/api/${this.resource}/${id}/`);
  }
}
