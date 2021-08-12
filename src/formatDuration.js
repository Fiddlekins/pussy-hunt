export default function formatDuration(duration){
	const seconds = duration;
	const minutes = seconds / 60;
	const hours = minutes / 60;
	const days = hours / 24;
	let string = `${days.toFixed(1)} days`;
	if (days < 1) {
		string = `${hours.toFixed(1)} hours`;
		if (hours < 1) {
			string = `${minutes.toFixed(1)} minutes`;
			if (minutes < 1) {
				string = `${seconds.toFixed(1)} seconds`;
			}
		}
	}
	return string;
}
