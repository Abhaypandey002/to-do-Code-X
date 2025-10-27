export function formatISODate(date) {
  return date.toISOString().split('T')[0];
}

export function getMonthMatrix(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const matrix = [];
  let current = new Date(year, month, 1 - startDay);
  for (let i = 0; i < 42; i += 1) {
    matrix.push({
      date: new Date(current),
      currentMonth: current.getMonth() === month,
    });
    current.setDate(current.getDate() + 1);
  }
  return matrix;
}
