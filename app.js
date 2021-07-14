const request = require('request');
const express = require('express');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const app = express();
const myEmitter = new MyEmitter();
const port = process.env.PORT || 3000;

app.get('/data', (req, res, next) => {
	try {
		const optionArr = [];
		const response = [];
		const totalCalls = 10;
		const bracket = 4;
		let callCount = 0;

		// Preparing payload for API calls
		for (let i = 0; i < totalCalls; i++) {
			const option = {
				method: 'GET',
				url: `https://api.instantwebtools.net/v1/passenger?page=${i}&size=10`,
				headers: {},
			};
			optionArr.push(option);
		}

		function callApi(option) {
			request(option, (err, res) => {
				if (err) throw err;
				const { data } = JSON.parse(res.body);
				response.push(data);
				console.log(
					`\nongoing requests: ${
						totalCalls - callCount - optionArr.length
					}\ncompleted requests: ${callCount++}\npending requests: ${
						optionArr.length
					}\n`
				);
				if (optionArr.length) {
					const option = optionArr.shift();
					callApi(option);
				}

				// End of requests, emitting event to trigger the response
				if (response.length === totalCalls) myEmitter.emit('done', response);
			});
		}

		// Calling the endpoint simultaneously for the given(bracket) amount of time
		for (let i = 0; i < bracket; i++) {
			const option = optionArr.shift(i);
			callApi(option);
		}

		myEmitter.once('done', (data) => {
			console.log(
				'Successfully fetched data from same API with pagination up to page 10!'
			);
			res.status(200).json({ data: data });
		});
	} catch (error) {
		console.error(error);
		res.status(500).json(error);
	}
});

app.listen(3000, 'localhost', () => {
	console.log(`Listening on port ${port}`);
});
