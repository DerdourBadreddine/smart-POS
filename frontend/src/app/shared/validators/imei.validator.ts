import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function imeiValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value?.trim() ?? '';
    if (!value) {
      return null;
    }
    if (!/^\d{15}$/.test(value)) {
      return { imeiFormat: true };
    }
    let sum = 0;
    for (let index = 0; index < 14; index += 1) {
      let digit = Number(value[index]);
      if (index % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return (10 - (sum % 10)) % 10 === Number(value[14]) ? null : { imeiChecksum: true };
  };
}
