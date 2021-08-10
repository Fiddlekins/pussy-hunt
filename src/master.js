import {fork} from 'child_process';
import path from 'path';
import {fileURLToPath} from 'url';
import bips0039 from './bips0039.js';

const rootPath = path.join(fileURLToPath(import.meta.url), '..', '..');
const workerPath = path.join(rootPath, 'src', 'worker.js');

const targetPublicAddress = '0x1d593097Ea77d546389fbfe73c3b59cff1f84873';

const guess = [
	['bone'],
	['snack', 'dinner'],
	['more'],
	['mixture', 'mix', 'merge', 'code', 'multiply'],
	['base', 'common', 'split', 'small', 'tiny'],
	['mix', 'tornado', 'mixed', 'mask', 'tumble'],
	[],//['wine', 'crisp', 'alcohol'],
	['tube', 'subway'],
	[],//['number', 'random', 'series', 'disorder'],
	['wolf'],
	['moon'],
	['shadow', 'negative', 'light', 'space']
];

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
				const hoursRemaining = secondsRemaining / 60 / 60;
				console.log(`${totalAttempts}/${totalCombinations} running at ${attemptsPerSecond.toFixed(1)} attempts/second - finish in ${hoursRemaining.toFixed(1)} hours`);
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
