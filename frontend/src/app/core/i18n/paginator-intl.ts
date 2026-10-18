import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from './language.service';

@Injectable()
export class LocalPaginatorIntl extends MatPaginatorIntl {
  private readonly language=inject(LanguageService);
  private readonly i18n=inject(TranslocoService);
  constructor(){
    super();
    effect(()=>{
      this.language.language();
      this.itemsPerPageLabel=this.i18n.translate('pagination.itemsPerPage');
      this.nextPageLabel=this.i18n.translate('pagination.nextPage');
      this.previousPageLabel=this.i18n.translate('pagination.previousPage');
      this.firstPageLabel=this.i18n.translate('pagination.firstPage');
      this.lastPageLabel=this.i18n.translate('pagination.lastPage');
      this.changes.next();
    });
    this.getRangeLabel=(page,size,length)=>`${length ? page*size+1 : 0}–${Math.min((page+1)*size,length)} / ${length}`;
  }
}
