import {arrayify} from './bytes.js';
import {sha256} from './sha2.js';


// Returns a byte with the MSB bits set
function getUpperMask(bits) {
	return ((1 << bits) - 1) << (8 - bits);
}

// export function mnemonicToEntropy(mnemonic, wordlist) {
export function isMnemonicValid(words) {
	// const words = wordlist.split(mnemonic);
	// if ((words.length % 3) !== 0) { throw new Error("invalid mnemonic"); }

	const entropy = arrayify(new Uint8Array(Math.ceil(11 * words.length / 8)));

	let offset = 0;
	for (let i = 0; i < words.length; i++) {
		let index = words[i];
		// if (index === -1) { throw new Error("invalid mnemonic"); }

		for (let bit = 0; bit < 11; bit++) {
			if (index & (1 << (10 - bit))) {
				entropy[offset >> 3] |= (1 << (7 - (offset % 8)));
			}
			offset++;
		}
	}

	const entropyBits = 32 * words.length / 3;

	const checksumBits = words.length / 3;
	const checksumMask = getUpperMask(checksumBits);

	const checksum = arrayify(sha256(entropy.slice(0, entropyBits / 8)))[0] & checksumMask;

	if (checksum !== (entropy[entropy.length - 1] & checksumMask)) {
		// throw new Error("invalid checksum");
		return false;
	}
	return true;

	// return hexlify(entropy.slice(0, entropyBits / 8));
}