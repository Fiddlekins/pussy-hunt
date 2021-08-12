import {HDNode} from '@ethersproject/hdnode';
import {wordlists} from 'ethers';
import calculateFactors from './calculateFactors.js';
import {computeAddress} from './ethers/computeAddress.js';
import fromSeed from './ethers/fromSeed.js';
import {isMnemonicValid} from './ethers/isMnemonicValid.js';
import {mnemonicToSeed} from './ethers/mnemonicToSeed.js';
import {SigningKey} from './ethers/signingKey.js';
import indexToSubIndices from './indexToSubIndices.js';

const defaultPath = "m/44'/60'/0'/0/0";

let started = false;
process.on('message', (config) => {
	if (!started) {
		started = true;
		work(config);
	}
})

function setTimeoutPromise(duration) {
	return new Promise((resolve => setTimeout(resolve, duration)));
}

function inform(found, newAttempts, mnemonic, privateKey) {
	// console.log(found,newAttempts,mnemonic,privateKey)
	const payload = {
		found,
		newAttempts
	};
	if (found) {
		payload.mnemonic = mnemonic;
		payload.privateKey = privateKey;
	}
	process.send(payload);
}

async function work(config) {
	const {processedGuess, startIndex, endIndex, targetPublicAddress} = config;
	const wordIndices = processedGuess.map((wordGuess) => wordGuess.map((word) => wordlists.en.getWordIndex(word.normalize("NFKD"))));
	const bases = processedGuess.map(e => e.length);
	const factors = calculateFactors(bases);
	let newAttempts = 0;
	let found = false;
	let wallet;
	let words;
	let mnemonic;
	let subIndices;


	subIndices = indexToSubIndices(startIndex, factors);

	// let totalAttempts = 0;
	// const fullAttempts = endIndex - startIndex;
	// const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12] = subIndices;
	// const [pg1, pg2, pg3, pg4, pg5, pg6, pg7, pg8, pg9, pg10, pg11, pg12] = processedGuess;
	// const pg1l = pg1.length;
	// const pg2l = pg2.length;
	// const pg3l = pg3.length;
	// const pg4l = pg4.length;
	// const pg5l = pg5.length;
	// const pg6l = pg6.length;
	// const pg7l = pg7.length;
	// const pg8l = pg8.length;
	// const pg9l = pg9.length;
	// const pg10l = pg10.length;
	// const pg11l = pg11.length;
	// const pg12l = pg12.length;
	// let w1i = true;
	// let w2i = true;
	// let w3i = true;
	// let w4i = true;
	// let w5i = true;
	// let w6i = true;
	// let w7i = true;
	// let w8i = true;
	// let w9i = true;
	// let w10i = true;
	// let w11i = true;
	// let w12i = true;
	// let w1t;
	// let w2t;
	// let w3t;
	// let w4t;
	// let w5t;
	// let w6t;
	// let w7t;
	// let w8t;
	// let w9t;
	// let w10t;
	// let w11t;
	// let w12t;
	// const wt = [];
	// const pgl = processedGuess.map(e => e.length);
	// const wi = processedGuess.map(() => true);
	// const w = processedGuess.map(() => 0);
	// const s = subIndices;
	// const pg = processedGuess;

	// for (w[0] = wi[0] ? s[0] : 0; w[0] < pgl[0]; w[0]++) {
	// 	wi[0] = false;
	// 	wt[0] = pg[0][w[0]];
	// 	for (w[1] = wi[1] ? s[1] : 0; w[1] < pgl[1]; w[1]++) {
	// 		wi[1] = false;
	// 		wt[1] = pg[1][w[1]];
	// 		for (w[2] = wi[2] ? s[2] : 0; w[2] < pgl[2]; w[2]++) {
	// 			wi[2] = false;
	// 			wt[2] = pg[2][w[2]];
	// 			for (w[3] = wi[3] ? s[3] : 0; w[3] < pgl[3]; w[3]++) {
	// 				wi[3] = false;
	// 				wt[3] = pg[3][w[3]];
	// 				for (w[4] = wi[4] ? s[4] : 0; w[4] < pgl[4]; w[4]++) {
	// 					wi[4] = false;
	// 					wt[4] = pg[4][w[4]];
	// 					for (w[5] = wi[5] ? s[5] : 0; w[5] < pgl[5]; w[5]++) {
	// 						wi[5] = false;
	// 						wt[5] = pg[5][w[5]];
	// 						for (w[6] = wi[6] ? s[6] : 0; w[6] < pgl[6]; w[6]++) {
	// 							wi[6] = false;
	// 							wt[6] = pg[6][w[6]];
	// 							for (w[7] = wi[7] ? s[7] : 0; w[7] < pgl[7]; w[7]++) {
	// 								wi[7] = false;
	// 								wt[7] = pg[7][w[7]];
	// 								for (w[8] = wi[8] ? s[8] : 0; w[8] < pgl[8]; w[8]++) {
	// 									wi[8] = false;
	// 									wt[8] = pg[8][w[8]];
	// 									for (w[9] = wi[9] ? s[9] : 0; w[9] < pgl[9]; w[9]++) {
	// 										wi[9] = false;
	// 										wt[9] = pg[9][w[9]];
	// 										for (w[10] = wi[10] ? s[10] : 0; w[10] < pgl[10]; w[10]++) {
	// 											wi[10] = false;
	// 											wt[10] = pg[10][w[10]];
	// 											for (w[11] = wi[11] ? s[11] : 0; w[11] < pgl[11]; w[11]++) {
	// 												wi[11] = false;
	// 												wt[11] = pg[11][w[11]];
	// 												mnemonic = wt.join(' ');
	// 												newAttempts++;
	// 												totalAttempts++;
	// 												try {
	// 													wallet = ethers.Wallet.fromMnemonic(mnemonic);
	// 													found = wallet.address.toLowerCase() === targetPublicAddress;
	// 												} catch (err) {
	// 													// console.log(err);
	// 												}
	// 												if (found || totalAttempts >= fullAttempts) {
	// 													inform(found, newAttempts, mnemonic, wallet);
	// 													return;
	// 												}
	// 												if (newAttempts >= 1000) {
	// 													inform(found, newAttempts, mnemonic, wallet);
	// 													newAttempts = 0;
	// 													await setTimeoutPromise(1);
	// 												}
	// 											}
	// 										}
	// 									}
	// 								}
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }
	// inform(found, newAttempts, mnemonic, wallet);
	// return;


	// for (let w1 = w1i ? s1 : 0; w1 < pg1l; w1++) {
	// 	w1i = false;
	// 	// w1t = pg1[w1];
	// 	wt[0] = pg1[w1];
	// 	for (let w2 = w2i ? s2 : 0; w2 < pg2l; w2++) {
	// 		w2i = false;
	// 		// w2t = pg2[w2];
	// 		wt[1] = pg2[w2];
	// 		for (let w3 = w3i ? s3 : 0; w3 < pg3l; w3++) {
	// 			w3i = false;
	// 			// w3t = pg3[w3];
	// 			wt[2] = pg3[w3];
	// 			for (let w4 = w4i ? s4 : 0; w4 < pg4l; w4++) {
	// 				w4i = false;
	// 				// w4t = pg4[w4];
	// 				wt[3] = pg4[w4];
	// 				for (let w5 = w5i ? s5 : 0; w5 < pg5l; w5++) {
	// 					w5i = false;
	// 					// w5t = pg5[w5];
	// 					wt[4] = pg5[w5];
	// 					for (let w6 = w6i ? s6 : 0; w6 < pg6l; w6++) {
	// 						w6i = false;
	// 						// w6t = pg6[w6];
	// 						wt[5] = pg6[w6];
	// 						for (let w7 = w7i ? s7 : 0; w7 < pg7l; w7++) {
	// 							w7i = false;
	// 							// w7t = pg7[w7];
	// 							wt[6] = pg7[w7];
	// 							for (let w8 = w8i ? s8 : 0; w8 < pg8l; w8++) {
	// 								w8i = false;
	// 								// w8t = pg8[w8];
	// 								wt[7] = pg8[w8];
	// 								for (let w9 = w9i ? s9 : 0; w9 < pg9l; w9++) {
	// 									w9i = false;
	// 									// w9t = pg9[w9];
	// 									wt[8] = pg9[w9];
	// 									for (let w10 = w10i ? s10 : 0; w10 < pg10l; w10++) {
	// 										w10i = false;
	// 										// w10t = pg10[w10];
	// 										wt[9] = pg10[w10];
	// 										for (let w11 = w11i ? s11 : 0; w11 < pg11l; w11++) {
	// 											w11i = false;
	// 											// w11t = pg11[w11];
	// 											wt[10] = pg11[w11];
	// 											for (let w12 = w12i ? s12 : 0; w12 < pg12l; w12++) {
	// 												w12i = false;
	// 												// w12t = pg12[w12];
	// 												wt[11] = pg12[w12];
	// 												// mnemonic = w1t + ' ' + w2t + ' ' + w3t + ' ' + w4t + ' ' + w5t + ' ' + w6t + ' ' + w7t + ' ' + w8t + ' ' + w9t + ' ' + w10t + ' ' + w11t + ' ' + w12t;
	// 												mnemonic = wt.join(' ');
	// 												newAttempts++;
	// 												totalAttempts++;
	// 												try {
	// 													wallet = ethers.Wallet.fromMnemonic(mnemonic);
	// 													found = wallet.address.toLowerCase() === targetPublicAddress;
	// 												} catch (err) {
	// 													// console.log(err);
	// 												}
	// 												if (found || totalAttempts >= fullAttempts) {
	// 													inform(found, newAttempts, mnemonic, wallet);
	// 													return;
	// 												}
	// 												if (newAttempts >= 1000) {
	// 													inform(found, newAttempts, mnemonic, wallet);
	// 													newAttempts = 0;
	// 													await setTimeoutPromise(1);
	// 												}
	// 											}
	// 										}
	// 									}
	// 								}
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }
	// inform(found, newAttempts, mnemonic, wallet);
	// return;

	for (let index = startIndex; index < endIndex; index++) {
		newAttempts++;
		subIndices = indexToSubIndices(index, factors);
		words = subIndices.map((subIndice, wordIndex) => wordIndices[wordIndex][subIndice]);
		// words = subIndices.map((subIndice, wordIndex) => processedGuess[wordIndex][subIndice]);
		if (!isMnemonicValid(words)) {
			continue;
		}

		mnemonic = subIndices.map((subIndice, wordIndex) => processedGuess[wordIndex][subIndice]).join(' ');
		const seed = mnemonicToSeed(mnemonic);
		// mnemonic = words.join(' ');
		// let hdNode = HDNode._fromSeed(seed, {
		// 	phrase: mnemonic,
		// 	path: "m",
		// 	locale: 'en'
		// });
		// hdNode = hdNode.derivePath(defaultPath);
		// const privateKey = hdNode.privateKey;
		// found = hdNode.address.toLowerCase() === targetPublicAddress;

		const {privateKey,publicKey} = fromSeed(seed, defaultPath);
		const address = computeAddress(publicKey);
		found = address.toLowerCase() === targetPublicAddress;

		// const signingKey = new SigningKey(privateKey);
		// const publicKey = signingKey.compressedPublicKey;
		// console.log(privateKey, hdNode.privateKey)
		// console.log(signingKey.privateKey, hdNode.privateKey)
		// console.log(publicKey, hdNode.publicKey)
		// console.log(address, hdNode.address);

		if (found) {
			inform(found, newAttempts, mnemonic, privateKey);
			return;
		}
		if (newAttempts >= 5000) {
			inform(found, newAttempts, mnemonic, privateKey);
			newAttempts = 0;
			await setTimeoutPromise(1);
		}
	}
	inform(found, newAttempts, mnemonic, privateKey);
}

process.send('ready');
