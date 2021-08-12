// import {pbkdf2} from '@ethersproject/pbkdf2';
// import {toUtf8Bytes, UnicodeNormalizationForm} from '@ethersproject/strings';
import {pbkdf2} from './pbkdf2.js';
import {toUtf8Bytes, UnicodeNormalizationForm} from './utf8.js';

// export function mnemonicToSeed(mnemonic, password) {
// 	if (!password) {
// 		password = "";
// 	}
//
// 	const salt = toUtf8Bytes("mnemonic" + password, UnicodeNormalizationForm.NFKD);
//
// 	return pbkdf2(toUtf8Bytes(mnemonic, UnicodeNormalizationForm.NFKD), salt, 2048, 64, "sha512");
// }


const password = "";
const salt = toUtf8Bytes("mnemonic" + password, UnicodeNormalizationForm.NFKD);

export function mnemonicToSeed(mnemonic) {
	return pbkdf2(toUtf8Bytes(mnemonic, UnicodeNormalizationForm.NFKD), salt, 2048, 64, "sha512");
}
