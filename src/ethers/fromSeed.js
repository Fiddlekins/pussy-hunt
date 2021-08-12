import {BigNumber} from '@ethersproject/bignumber';
import {SupportedAlgorithm} from '@ethersproject/sha2';
import {arrayify, hexlify, hexZeroPad} from './bytes.js';
import {computeHmac} from './sha2.js';
import {SigningKey} from './signingKey.js';
import {toUtf8Bytes} from './utf8.js';

const MasterSecret = toUtf8Bytes("Bitcoin seed");
const HardenedBit = 0x80000000;
const N = BigNumber.from("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");

function bytes32(value) {
	return hexZeroPad(hexlify(value), 32);
}

export default function fromSeed(seed, path) {
	const seedArray = arrayify(seed);
	if (seedArray.length < 16 || seedArray.length > 64) {
		throw new Error("invalid seed");
	}

	const I = arrayify(computeHmac("sha512", MasterSecret, seedArray));
	let privateKey = bytes32(I.slice(0, 32));
	const signingKey = new SigningKey(privateKey);
	let publicKey = signingKey.compressedPublicKey;
	// const parentFingerprint = "0x00000000";
	let chainCode = bytes32(I.slice(32));
	let index = 0;
	// let depth = 0;

	const derive = (deriveIndex) => {
		if (deriveIndex > 0xffffffff) {
			throw new Error("invalid deriveIndex - " + String(deriveIndex));
		}

		// Base path
		// let path = this.path;
		// if (path) { path += "/" + (deriveIndex & ~HardenedBit); }

		const data = new Uint8Array(37);

		if (deriveIndex & HardenedBit) {
			// if (!privateKey) {
			// 	throw new Error("cannot derive child of neutered node");
			// }

			// Data = 0x00 || ser_256(k_par)
			data.set(arrayify(privateKey), 1);

			// Hardened path
			// if (path) { path += "'"; }

		} else {
			// Data = ser_p(point(k_par))
			data.set(arrayify(publicKey));
		}

		// Data += ser_32(i)
		for (let i = 24; i >= 0; i -= 8) {
			data[33 + (i >> 3)] = ((deriveIndex >> (24 - i)) & 0xff);
		}

		const I = arrayify(computeHmac(SupportedAlgorithm.sha512, chainCode, data));
		const IL = I.slice(0, 32);
		const IR = I.slice(32);

		// The private key
		let ki = null

		// The public key
		let Ki = null;

		if (privateKey) {
			ki = bytes32(BigNumber.from(IL).add(privateKey).mod(N));
		} else {
			const ek = new SigningKey(hexlify(IL));
			Ki = ek._addPoint(publicKey);
		}

		privateKey = ki;
		// publicKey = Ki;
		chainCode = bytes32(IR);
		index = deriveIndex;
		// depth = depth + 1


		const signingKey = new SigningKey(privateKey);
		publicKey = signingKey.compressedPublicKey;

	}

	const components = path.split("/");

	// if (components.length === 0 || (components[0] === "m" && depth !== 0)) {
	// 	throw new Error("invalid path - " + path);
	// }

	if (components[0] === "m") {
		components.shift();
	}
	for (let i = 0; i < components.length; i++) {
		const component = components[i];
		if (component.match(/^[0-9]+'$/)) {
			const index = parseInt(component.substring(0, component.length - 1));
			// if (index >= HardenedBit) { throw new Error("invalid path index - " + component); }
			derive(HardenedBit + index);
		} else if (component.match(/^[0-9]+$/)) {
			const index = parseInt(component);
			// if (index >= HardenedBit) { throw new Error("invalid path index - " + component); }
			derive(index);
		} else {
			throw new Error("invalid path component - " + component);
		}
	}

	return {privateKey, publicKey};
}
