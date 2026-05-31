const MIN_CAR_YEAR = 1970;

function getMaxCarYear() {
  return new Date().getFullYear();
}

export function isSelectableCarYear(year?: number | null): year is number {
  if (year == null || !Number.isInteger(year)) {
    return false;
  }

  return year >= MIN_CAR_YEAR && year <= getMaxCarYear();
}

export function getSelectableCarYears(
  includeYears: Array<number | null | undefined> = [],
) {
  const years = new Set<number>();

  for (let year = getMaxCarYear(); year >= MIN_CAR_YEAR; year -= 1) {
    years.add(year);
  }

  for (const year of includeYears) {
    if (year != null && Number.isInteger(year)) {
      years.add(year);
    }
  }

  return Array.from(years).sort((left, right) => right - left);
}
