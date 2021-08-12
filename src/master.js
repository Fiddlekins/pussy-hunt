import {defaultPath, HDNode} from '@ethersproject/hdnode';
import {fork} from 'child_process';
import path from 'path';
import {fileURLToPath} from 'url';
import bips0039 from './bips0039.js';
import {mnemonicToSeed} from './ethers/mnemonicToSeed.js';
import formatDuration from './formatDuration.js';

const rootPath = path.join(fileURLToPath(import.meta.url), '..', '..');
const workerPath = path.join(rootPath, 'src', 'worker.js');

const targetPublicAddress = '0x1d593097Ea77d546389fbfe73c3b59cff1f84873'.toLowerCase();
// const targetPublicAddress = '0xEDF54f8B532261B049D3635Ab00D3Ac210C6cc99'.toLowerCase();

const guess = [
	['bone'],
	['dinner'],
	['more'],
	['mixture', 'mix', 'merge', 'code', 'multiply'],
	['base', 'common', 'split', 'small', 'tiny'],
	['mix', 'tornado', 'mixed', 'mask', 'tumble'],
	[],//['wine', 'crisp', 'alcohol'],
	['tube', 'subway'],
	['lottery'],//['number', 'random', 'series', 'disorder'],
	['wolf'],
	['moon'],
	['shadow', 'negative', 'light', 'space']
];

// const mnemonic = 'miss differ royal tired menu merit obvious escape shaft manage frost salad';
// const guess = mnemonic.split(' ').map(e => [e]);
// guess[0] = bips0039;
// guess[0] = ['shadow', 'negative', 'light', 'space', 'miss'];
// guess[1] = bips0039;
// guess[1] = 'bone';

// const hdNode = HDNode.fromMnemonic(mnemonic, null, wordlists.en).derivePath(defaultPath);
// let hdNode = HDNode._fromSeed(mnemonicToSeed(mnemonic), {
// 	phrase: mnemonic,
// 	path: "m",
// 	locale: 'en'
// });
// hdNode = hdNode.derivePath(defaultPath);
// console.log(hdNode.privateKey)
// console.log(hdNode.address.toLowerCase() === targetPublicAddress);

// process.exit();

async function init() {
	const processedGuess = guess.map((e) => e.length ? e : bips0039);
	const totalCombinations = processedGuess.reduce((acc, curr) => {
		return acc * curr.length;
	}, 1);
	console.log(`Total Combinations: ${totalCombinations}`);

	const workerCount = 8;
	const attemptsPerWorker = totalCombinations / workerCount;
	let totalAttempts = 0;
	const timestampStart = Date.now();
	for (let workerIndex = 0; workerIndex < workerCount; workerIndex++) {
		const worker = fork(workerPath);
		const startIndex = workerIndex * attemptsPerWorker;
		const endIndex = workerIndex === workerCount - 1 ? totalCombinations : startIndex + attemptsPerWorker;

		worker.on('message', (message) => {
			if (message === 'ready') {
				worker.send({processedGuess, startIndex, endIndex, targetPublicAddress});
			} else {
				const {
					found,
					mnemonic,
					privateKey,
					newAttempts
				} = message;
				totalAttempts += newAttempts;
				const computationTimeInSeconds = (Date.now() - timestampStart) / 1000;
				const attemptsPerSecond = totalAttempts / computationTimeInSeconds;
				const secondsRemaining = (totalCombinations - totalAttempts) * (1 / attemptsPerSecond);
				const remainingString = formatDuration(secondsRemaining);
				const spentString = formatDuration(computationTimeInSeconds);
				console.log(`${totalAttempts}/${totalCombinations} running at ${attemptsPerSecond.toFixed(1)} attempts/second - finish in ${remainingString} - taken ${spentString}`);
				if (found) {
					console.log(`Somehow we did it boys! ${privateKey}`);
					console.log(mnemonic);
					process.exit();
				} else if (totalAttempts >= totalCombinations) {
					console.log(`That was a bust lads...`);
					process.exit();
				}
			}
		});
		worker.on('close', (code) => {
			console.log(`child process close all stdio with code ${code}`);
		});
		worker.on('exit', (code) => {
			console.log(`child process exited with code ${code}`);
		});
	}
}

init().catch(console.error);
