export function shiftDay(date: string, amount: number) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + amount);
  return shifted.toISOString().slice(0, 10);
}

export function weekdayLabel(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return weekday === 0 ? "CN" : `T${weekday + 1}`;
}

export function fullDayLabel(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const label = weekday === 0 ? "Chủ nhật" : `Thứ ${weekday + 1}`;
  const [year, month, day] = date.split("-");
  return `${label}, ${day}/${month}/${year}`;
}
