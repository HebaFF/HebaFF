// Converts between epoch ms and the string format the native
// `<input type="datetime-local">` element expects/emits ("YYYY-MM-DDTHH:mm"),
// using local time (matching how the input itself interprets the value).
function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): number {
  return new Date(value).getTime();
}
