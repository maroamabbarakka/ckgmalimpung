# PR REVIEW TEMPLATE

## IDENTITAS PR

Judul:
Area:
Prioritas:
Risiko:

## FILE DIUBAH

- [ ] hanya file relevan
- [ ] tidak ada perubahan acak
- [ ] tidak ada rename tanpa alasan

## FUNCTIONAL CHECK

- [ ] fitur lama tetap jalan
- [ ] tidak ada route blank
- [ ] form tetap menyimpan data
- [ ] export tetap jalan

## SECURITY CHECK

- [ ] tidak ada credential hardcoded
- [ ] tidak ada role trust dari frontend saja
- [ ] rules tidak dilonggarkan

## UI CHECK

- [ ] mobile aman
- [ ] desktop aman
- [ ] tombol minimal 44px di mobile
- [ ] loading state ada

## ACCEPTANCE

PR boleh merge jika seluruh checklist tercentang.