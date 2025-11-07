// utils/date.ts
export function toIsoFromDateAndTimeLocal(dateStr: string, timeStr: string): string {
  // Expect date=YYYY-MM-DD and time=HH:mm
  const [y, m, d] = (dateStr || "").split("-").map(Number);
  const [hh, mm] = (timeStr || "").split(":").map(Number);

  if (!y || !m || !d || (hh ?? -1) < 0 || (mm ?? -1) < 0 || mm > 59 || hh > 23) {
    throw new Error("Invalid time selected"); // clear & consistent message
  }

  // Construct as local time, DB will store in UTC
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(dt.getTime())) throw new Error("Invalid time selected");

  return dt.toISOString();
}
