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
	let badFlags = flagsString.match(/[^tsc]+/g)
	if (badFlags) throw `Error: unknown flags ${badFlags.join(', ')}`
	let tv = /t/.test(flagsString)
	let sortBySeeders = /s/.test(flagsString)
	let clipboardMagnetLinks = /c/.test(flagsString)
	return { tv, sortBySeeders, clipboardMagnetLinks }
}

function startApp() {
	const args = process.argv.slice(2)
	const noArgumentsGiven = args.length === 0
	let hasFlags = false
	let title = args.slice(1).join(' ')
	let flagsArgIndex
	if (args)
		args.forEach((arg, i) => {
			if (/^-/.test(arg)) {
				flagsArgIndex = i
				hasFlags = true
			}
		})
	if (flagsArgIndex !== 0) {
		title = args.slice(0, flagsArgIndex).join(' ')
		let titleAfterFlags = args[flagsArgIndex + 1]
		if (titleAfterFlags) {
			try {
				throw 'Error: Please put flags before or after entire title'
			} catch (err) {
				console.log(err)
			}
			process.exit(1)
		}
	}

	if (noArgumentsGiven) {
		welcome().then(({ typeOfDownload }) => (typeOfDownload === 'movie' ? new Movie() : new Series()))
	} else if (args[0] === 'help') new Message().help()
	else if (hasFlags) {
		let flags = flagsArgIndex ? args[flagsArgIndex].slice(1) : args[0].slice(1)
		getFlags(flags)
			.then(({ tv, sortBySeeders, clipboardMagnetLinks }) => {
				if (tv) {
					if (title) new Series(title)
					else new Series('')
				} else if (sortBySeeders || clipboardMagnetLinks) {
					if (title) new Movie(title, sortBySeeders, clipboardMagnetLinks)
					else new Movie('', sortBySeeders)
				}
			})
			.catch((err) => console.log(err))

		// let title = args.slice(1).join(' ')
		// new Series(title)
	} else {
		let title = args.join(' ')
		new Movie(title)
	}
}

startApp()
