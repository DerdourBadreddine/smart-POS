"""Custom validators used across apps."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def _imei_checksum(digits: str) -> int:
    total = 0
    reversed_digits = list(reversed(digits[:14]))
    for index, char in enumerate(reversed_digits, start=1):
        digit = int(char)
        if index % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return (10 - (total % 10)) % 10


def validate_imei(value: str) -> None:
    """Validate a 15-digit IMEI using the Luhn algorithm."""

    if len(value) != 15 or not value.isdigit():
        raise ValidationError(_("IMEI must contain exactly 15 digits."))
    if int(value[-1]) != _imei_checksum(value):
        raise ValidationError(_("IMEI check digit is invalid."))
