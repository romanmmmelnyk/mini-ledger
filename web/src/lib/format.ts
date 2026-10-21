const DAY_MS = 86_400_000;

const dayFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' });
const dayYearFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDay = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });
const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const dateTime = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayKey(iso: string) {
  return String(startOfDay(new Date(iso)));
}

export function formatDayHeading(iso: string) {
  const date = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.getFullYear() === new Date().getFullYear()
    ? dayFormat.format(date)
    : dayYearFormat.format(date);
}

export const formatTime = (iso: string) => time.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatShortDay = (ms: number) => shortDay.format(new Date(ms));
