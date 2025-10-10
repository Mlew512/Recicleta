
/**
 * Generate a sequential code based on a prefix and an array of existing codes.
 * Example: nextSequential('B', ['B001', 'B002']) -> 'B003'
 */
export const nextSequential = (prefix: string, codes: string[]): string => {
  let max = 0
  for (const code of codes) {
    const match = code.match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (!isNaN(num)) max = Math.max(max, num)
    }
  }
  // Avoid String.prototype.padStart in case a global type override exists.
  const seq = (max + 1).toString()
  const padded = ('000' + seq).slice(-3)
  return `${prefix}${padded}`
}

// Example usage helpers
export const nextBikeCode   = (codes: string[]) => nextSequential('B', codes)
export const nextRentalCode = (codes: string[]) => nextSequential('T', codes)
export const nextSaleCode   = (codes: string[]) => nextSequential('S', codes)
