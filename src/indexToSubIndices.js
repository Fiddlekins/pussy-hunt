export default function indexToSubIndices(index, factors) {
	const subIndices = [];
	let r = index;
	for (const factor of factors) {
		subIndices.push(Math.floor(r / factor));
		r = r % factor;
	}
	return subIndices;
}
