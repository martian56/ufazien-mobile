// Major and Year Utility Functions

export const majorOptions = [
  { code: 'CS', display: 'Computer Science' },
  { code: 'CH', display: 'Chemistry' },
  { code: 'CE', display: 'Chemical Engineering' },
  { code: 'OGE', display: 'Oil and Gas Engineering' },
  { code: 'GE', display: 'Geophysical Engineering' },
  { code: 'UD', display: 'Undeclared' },
];

export const getMajorDisplayName = (code: string | null | undefined): string => {
  if (!code) return 'Undeclared';
  const major = majorOptions.find((m) => m.code === code);
  return major ? major.display : 'Undeclared';
};

// Format year for display (e.g., "Year 1" or "Graduate")
export const formatYearDisplay = (year: string | number | null | undefined): string => {
  if (!year) return '';
  const yearStr = String(year);
  if (yearStr === '5') return 'Graduate';
  return `Year ${yearStr}`;
};

// Get year display text (e.g., "1" or "Graduate")
export const getYearDisplay = (year: string | number | null | undefined): string => {
  if (!year) return '';
  const yearStr = String(year);
  if (yearStr === '5') return 'Graduate';
  return yearStr;
};

// Format year with ordinal (e.g., "1st Year" or "Graduate")
export const formatYearWithOrdinal = (year: string | number | null | undefined): string => {
  if (!year) return '';
  const yearStr = String(year);
  if (yearStr === '5') return 'Graduate';
  const num = parseInt(yearStr);
  if (isNaN(num)) return yearStr;
  const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
  return `${num}${suffix} Year`;
};
