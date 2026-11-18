export function formatVND(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "0 ₫";
  const abs = Math.abs(value);
  const formatted = Math.round(abs).toLocaleString("vi-VN");
  return (value < 0 ? "-" : "") + formatted + " ₫";
}

export function formatCompactVND(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "0M ₫";
  const inM = value / 1e6;
  return (inM >= 0 ? "+" : "") + inM.toFixed(2) + "M ₫";
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  return (value >= 0 ? "+" : "") + value.toFixed(1) + "%";
}
