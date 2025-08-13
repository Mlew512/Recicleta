export function calculateFee(days: number): number {
  if (days <= 1) return 0
  if (days <= 90) return 10
  if (days <= 180) return 20
  if (days <= 365) return 30
  return 50
}
