#! /usr/bin/env node
const prompts = require('prompts')

const { Series } = require('./components/Series')
const { Movie } = require('./components/Movie')
const { Message } = require('./components/Messages')

async function welcome() {
	new Message().welcome()
	return await prompts({
		type: 'select',
		name: 'typeOfDownload',
		message: 'Ahoy! What would you like to download?',
		choices: [ { title: 'Movie', value: 'movie' }, { title: 'TV Series', value: 'series' } ],
		initial: 0
	})
}

function startApp() {
	const arguments = process.argv.slice(2)
	if (arguments.length > 0) {
		if (arguments[0] === 'help') new Message().help()
		else if (arguments[0] === '--series' || arguments[0] === '-s') {
			let title = arguments.slice(1).join(' ')
			new Series(title)
		} else {
			let title = arguments.join(' ')
			new Movie(title)
		}
	} else {
		welcome().then(({ typeOfDownload }) => (typeOfDownload === 'movie' ? new Movie() : new Series()))
	}
}

startApp()
