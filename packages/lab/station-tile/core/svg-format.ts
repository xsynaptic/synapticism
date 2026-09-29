// Coarser sibling of formatSvgNumber for per-cell values, which repeat thousands of times
// 1dp still resolves ~6 levels of positional jitter at the smallest default grout
export function formatSvgCoord(value: number): string {
	return String(Math.round(value * 10) / 10);
}

// Up to 2 decimal places, no trailing zeros
export function formatSvgNumber(value: number): string {
	return String(Math.round(value * 100) / 100);
}
