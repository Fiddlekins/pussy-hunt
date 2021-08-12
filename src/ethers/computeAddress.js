import {getAddress} from '@ethersproject/address';
import {hexDataSlice} from './bytes.js';
import {keccak256} from './keccak256.js';
// import {computePublicKey} from '@ethersproject/signing-key';
import {computePublicKey} from './signingKey.js';

export function computeAddress(key) {
	const publicKey = computePublicKey(key);
	return getAddress(hexDataSlice(keccak256(hexDataSlice(publicKey, 1)), 12));
}