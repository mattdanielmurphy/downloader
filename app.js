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

async function getFlags(flagsString) {
	// check for bad flags
	let badFlags = flagsString.match(/[^tscb]+/g)
	if (badFlags) throw `Error: unknown flags ${badFlags.join(', ')}`
	let tv = /t/.test(flagsString)
	let sortBySeeders = /s/.test(flagsString)
	let clipboardMagnetLinks = /cb/.test(flagsString)
	return { tv, sortBySeeders, clipboardMagnetLinks }
}

function startApp() {
	const args = process.argv.slice(2)
	const noArgumentsGiven = args.length === 0
	const firstArg = args[0]
	const title = args.slice(1).join(' ')
	const hasFlags = /^-/.test(firstArg)

	if (noArgumentsGiven) {
		welcome().then(({ typeOfDownload }) => (typeOfDownload === 'movie' ? new Movie() : new Series()))
	} else if (firstArg === 'help') new Message().help()
	else if (hasFlags) {
		getFlags(firstArg.substr(1))
			.then(({ tv, sortBySeeders, clipboardMagnetLinks }) => {
				if (tv) {
					if (title) new Series(title)
					else new Series('')
				} else if (sortBySeeders || clipboardMagnetLinks) {
					if (title) new Movie(title, sortBySeeders, clipboardMagnetLinks)
					else new Movie('', sortBySeeders)
				}
			})
			.catch((err) => {
				console.log('err', err)
			})

		// let title = args.slice(1).join(' ')
		// new Series(title)
	} else {
		let title = args.join(' ')
		new Movie(title)
	}
}

startApp()
