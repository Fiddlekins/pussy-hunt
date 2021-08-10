import {ethers} from 'ethers';
import calculateFactors from './calculateFactors.js';
import indexToSubIndices from './indexToSubIndices.js';

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

async function work(config) {
	const {processedGuess, startIndex, endIndex, targetPublicAddress} = config;

	let newAttempts = 0;
	const bases = processedGuess.map(e => e.length);
	const factors = calculateFactors(bases);
	for (let index = startIndex; index < endIndex; index++) {
		newAttempts++;
		const subIndices = indexToSubIndices(index, factors);
		const mnemonic = subIndices.map((subIndice, wordIndex) => processedGuess[wordIndex][subIndice]).join(' ');
		let found = false;
		let wallet;
		try {
			wallet = ethers.Wallet.fromMnemonic(mnemonic);
			found = wallet.address === targetPublicAddress;
		} catch (err) {
			// console.log(err);
		}
		if (newAttempts >= 1000) {
			const payload = {
				found,
				newAttempts
			};
			if (found) {
				payload.mnemonic = mnemonic;
				payload.privateKey = wallet.privateKey;
			}
			process.send(payload);
			newAttempts = 0;
			await setTimeoutPromise(1);
		}
	}
}

process.send('ready');
