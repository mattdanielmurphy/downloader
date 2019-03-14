#! /usr/bin/env node
const prompts = require('prompts')

const { Series } = require('./components/Series')
const { Movie } = require('./components/Movie')
const welcomeMessage = require('./components/Welcome-Message.js')

async function welcome() {
	welcomeMessage()
	const typeOfDownload = await prompts({
		type: 'select',
		name: 'typeOfDownload',
		message: 'Ahoy! What would you like to download?',
		choices: [ { title: 'Movie', value: 'movie' }, { title: 'TV Series', value: 'series' } ],
		initial: 0
	})
	return typeOfDownload
}

const startApp = () => welcome().then(({ typeOfDownload }) => (typeOfDownload === 'movie' ? new Movie() : new Series()))

startApp()
