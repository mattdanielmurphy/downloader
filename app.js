const prompts = require('prompts')

const { Series } = require('./components/Series')
const { Movie } = require('./components/Movie')

async function welcome() {
	console.log('Welcome to Series Downloader!')
	const typeOfDownload = await prompts({
		type: 'select',
		name: 'typeOfDownload',
		message: 'What would you like to download?',
		choices: [ { title: 'Movie', value: 'movie' }, { title: 'TV Series', value: 'series' } ],
		initial: 0
	})
	return typeOfDownload
}

function startApp() {
	welcome().then(({ typeOfDownload }) => (typeOfDownload === 'movie' ? new Movie() : new Series()))
}

startApp()
