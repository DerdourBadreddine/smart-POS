"""Build UTF-8 gettext catalogs without a system GNU gettext installation."""
import json
import struct
from pathlib import Path


def compile_catalogs():
    root = Path(__file__).resolve().parent.parent / "locale"
    messages = json.loads((root / "messages.json").read_text(encoding="utf-8"))
    for index, language in enumerate(("fr", "ar")):
        directory = root / language / "LC_MESSAGES"
        directory.mkdir(parents=True, exist_ok=True)
        header = f"Content-Type: text/plain; charset=UTF-8\nLanguage: {language}\n"
        entries = {"": header, **{key: values[index] for key, values in messages.items()}}
        po = '\n\n'.join(f'msgid {json.dumps(key, ensure_ascii=False)}\nmsgstr {json.dumps(value, ensure_ascii=False)}' for key, value in sorted(entries.items()))
        (directory / "django.po").write_text(po + "\n", encoding="utf-8")
        keys = sorted(entries)
        originals = [key.encode("utf-8") for key in keys]
        translated = [entries[key].encode("utf-8") for key in keys]
        count = len(keys)
        offset = 28 + 16 * count
        original_table = []
        for item in originals:
            original_table.append((len(item), offset))
            offset += len(item) + 1
        translation_table = []
        for item in translated:
            translation_table.append((len(item), offset))
            offset += len(item) + 1
        binary = struct.pack('<7I', 0x950412de, 0, count, 28, 28 + 8 * count, 0, 0)
        binary += b''.join(struct.pack('<2I', *row) for row in original_table + translation_table)
        binary += b'\0'.join(originals) + b'\0' + b'\0'.join(translated) + b'\0'
        (directory / "django.mo").write_bytes(binary)


if __name__ == "__main__":
    compile_catalogs()
