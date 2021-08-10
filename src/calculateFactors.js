export default function calculateFactors (bases) {
	const factors = [];
	factors[bases.length - 1] = 1;
	for (let i = bases.length - 2; i >= 0; i--) {
		const base = bases[i + 1];
		factors[i] = (factors[i + 1] || 1) * base;
	}
	return factors;
}
