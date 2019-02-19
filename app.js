const { exec } = require('child_process')
const { search, checkIsUp, proxies } = require('piratebay-search')
const prompts = require('prompts')

function downloadTorrent(magnetLink) {
	exec(`open ${magnetLink}`, (err, stdout, stderr) => {
		if (err) console.log('Error:\n', stderr)
	})
}

async function getInfo() {
	let questions = [
		{
			type: 'text',
			name: 'title',
			message: 'What is the name of the series?',
			validate: (name) => (name.length < 2 ? 'You must provide the name of the series.' : true)
		},
		{
			type: 'number',
			name: 'season',
			message: 'Which season?',
			initial: 1,
			min: 1
		},
		{
			type: 'number',
			name: 'firstEp',
			message: 'What is the beginning of the range of episodes you want?',
			initial: 1,
			min: 1
		},
		{
			type: 'number',
			name: 'lastEp',
			message: 'What is the end of the range of episodes you want?',
			initial: 1,
			min: 1
		}
	]

	let response = await prompts(questions)
	return response
}

const leadingZero = (n) => (String(n).length < 2 ? 0 + String(n) : n)

function downloadTorrents(magnetLinks) {
	// node_modules/webtorrent-cli/bin/cmd.js
	magnetLinks.forEach((link) => downloadTorrent(link))
}

function getEpisodes(info) {
	let { title, season, firstEp, lastEp } = info
	new Promise((resolve) => {
		searchEpisode(title, Number(season), Number(firstEp), Number(lastEp), resolve)
	}).then((result) => {
		downloadTorrents(result)
	})
}

async function fakeSearch() {
	return [ { file: 'asdfasd' } ]
}

function searchEpisode(title, season, episode, lastEpisode, resolve, magnetLinks = []) {
	let searchQuery = `${title} s${leadingZero(season)}e${leadingZero(episode)}`
	process.stdout.write(`Searching for episode ${episode}...`)
	search(searchQuery, {
		link: 'https://thehiddenbay.com'
	})
		// fakeSearch()
		.then((res) => {
			let result = res[0]

			if (result) {
				magnetLinks.push(result.file)
				if (result.seeds < 1) process.stdout.write(` Found, but no seeds :(\n`)
				else process.stdout.write(` Found! Seeds: ${result.seeds}\n`)
			} else process.stdout.write(` Couldn't find it :(\n`)

			if (episode < lastEpisode) {
				searchEpisode(title, season, episode + 1, lastEpisode, resolve, magnetLinks)
			} else {
				resolve(magnetLinks)
			}
		})
		.catch(console.error)
}

function welcome() {
	console.log('Welcome to Series Downloader!')
}

function startApp() {
	welcome()
	getInfo().then((info) => {
		getEpisodes(info)
	})
}

startApp()
