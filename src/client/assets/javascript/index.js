// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
	onPageLoad();
	setupClickHandlers();
})

async function onPageLoad() {
	try {
		getTracks()
			.then((tracks) => {
				const html = renderTrackCards(tracks);
				renderAt('#tracks', html);
			});

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers);
				renderAt('#racers', html);
			});
	} catch(error) {
		console.log('Problem getting tracks and racers ::', error.message);
		console.error(error);
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target);
		}

		// Podracer form field
		const podracerCard = target.closest('.card.podracer');
		if (podracerCard) {
			handleSelectPodRacer(podracerCard);
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault();
	
			// start race
			handleCreateRace();
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target);
		}

	}, false);
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log('an error shouldn\'t be possible here');
		console.log(error);
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// Get player_id and track_id from the store
	const { player_id: playerId, track_id: trackId } = store;
	const trackName = document.querySelector(`[data-track-id="${trackId}"]`).innerText;

	// render starting UI
	renderAt('#race', renderRaceStartView(trackName));

	// invoke the API call to create the race, then save the result
	const race = await createRace(playerId, trackId);
	let { ID: raceID } = race;

	// fixes https://github.com/udacity/nd032-c3-asynchronous-programming-with-javascript-project-starter/issues/6
	raceID--;

	// update the store with the race id
	store.race_id = raceID;

	// The race has been created, now start the countdown
	// call the async function runCountdown
	await runCountdown();

	// call the async function startRace
	await startRace(raceID);

	// call the async function runRace
	await runRace(raceID);
}

function runRace(raceID) {
	try {
		return new Promise((resolve, reject) => {
			// use Javascript's built in setInterval method to get race info every 500ms
			const raceInterval = setInterval(() => {
				getRace(raceID)
					.then((res) => {
						const { status } = res;

						// if the race info status property is "in-progress", update the leaderboard
						if (status === 'in-progress') {
							renderAt('#leaderBoard', raceProgress(res.positions));
						// if the race info status property is "finished"
						} else if (status === 'finished') {
							clearInterval(raceInterval); // to stop the interval from repeating
							renderAt('#race', resultsView(res.positions)); // to render the results view
							resolve(res); // resolve the promise
						} else {
							throw new Error('Invalid status!');
						}
					})
					.catch((err) => {
						console.log('Problem running getRace::', err);
						clearInterval(raceInterval);
						reject(err);
					});
			}, 500);
		});
	// remember to add error handling for the Promise
	} catch (err) {
		console.log('Problem running runRace::', err);
	}
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise((resolve) => {
			// use Javascript's built in setInterval method to count down once per second
			const countInterval = setInterval(() => {
				// run this DOM manipulation to decrement the countdown for the user
				document.getElementById('big-numbers').innerHTML = --timer;
				if (timer < 1) {
					// if the countdown is done, clear the interval, resolve the promise, and return
					clearInterval(countInterval);
					resolve();
				}
			}, 1000);
		});
	} catch(error) {
		console.log(error);
	}
}

function handleEnableSubmit() {
	if (store.player_id !== undefined && store.track_id !== undefined) {
		document.getElementById('submit-create-race').disabled = false;
	}
}

function handleSelectPodRacer(target) {
	const id = target.dataset.racerId;
	console.log('selected a pod', id);

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected');
	if (selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	// save the selected racer to the store
	store.player_id = Number(id);

	handleEnableSubmit();
}

function handleSelectTrack(target) {
	const id = target.dataset.trackId;
	console.log('selected a track', id);

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	// save the selected track id to the store
	store.track_id = Number(id);

	handleEnableSubmit();
}

function handleAccelerate() {
	console.log('accelerate button clicked');

	// Invoke the API call to accelerate
	accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`;
	}

	const results = racers.map(renderRacerCard).join('');

	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;

	return `
		<li>
			<button type="button" class="card podracer" data-racer-id="${id}">
				<h3>${driver_name}</h3>
				<p>${top_speed}</p>
				<p>${acceleration}</p>
				<p>${handling}</p>
			</button>
		</li>
	`;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</h4>
		`;
	}

	const results = tracks.map(renderTrackCard).join('');

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track;

	return `
		<li>
			<button type="button" data-track-id="${id}" class="card track">${name}</button>
		</li>
	`;
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track) {
	return `
		<header>
			<h1>Race: ${track}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1);

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
	const userPlayer = positions.find((e) => e.id === store.player_id);
	userPlayer.driver_name += " (you)";

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1);
	let count = 1;

	const results = positions.map((p) => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results.join('')}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
	const node = document.querySelector(element);
	node.innerHTML = html;
}
// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------
const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	};
}

// Make a fetch call (with error handling!) to each of the following API endpoints 
function handleFetchSuccess(url) {
	return (res) => {
		if (!res.ok) {
			throw new Error(`Problem with ${url} request:: ${res.status}`);
		}
		return res.json();
	};
}

function handleFetchFail(err) {
	console.error(err);
	return [];
}

function getTracks() {
	const url = `${SERVER}/api/tracks`;

	// GET request to `${SERVER}/api/tracks`
	return fetch(url, defaultFetchOpts())
		.then(handleFetchSuccess(url))
		.catch(handleFetchFail);
}

function getRacers() {
	const url = `${SERVER}/api/cars`;

	// GET request to `${SERVER}/api/cars`
	return fetch(url, defaultFetchOpts())
		.then(handleFetchSuccess(url))
		.catch(handleFetchFail);
}

function createRace(player_id, track_id) {
	const body = { player_id, track_id };
	
	return fetch(`${SERVER}/api/races`, {
			method: 'POST',
			...defaultFetchOpts(),
			dataType: 'json',
			body: JSON.stringify(body),
		})
		.then((res) => res.json())
		.catch((err) => console.log('Problem with createRace request::', err));
}

function getRace(id) {
	const url = `${SERVER}/api/races/${id}`;

	// GET request to `${SERVER}/api/races/${id}`
	return fetch(url, defaultFetchOpts())
		.then(handleFetchSuccess(url))
		.catch(handleFetchFail);
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
			method: 'POST',
			...defaultFetchOpts(),
		})
		.then(() => {})
		.catch((err) => console.log('Problem with startRace request::', err));
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(() => {})
	.catch((err) => console.log('Problem with accelerate request::', err));
}
