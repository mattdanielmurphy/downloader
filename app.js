const { exec } = require('child_process')
const { search, checkIsUp, proxies } = require('piratebay-search')

function downloadTorrent(magnetLink) {
	exec(`open ${magnetLink}`, (err, stdout, stderr) => {
		if (err) console.log('Error:\n', stderr)
	})
}

function getInfo() {
	let input = process.argv.slice(2)
	let lastTitleWordIndex = input.findIndex((arg) => arg.match(/,$/))

	let title = input.slice(0, lastTitleWordIndex + 1).join(' ').split(',')[0]
	let otherInfo = input.slice(lastTitleWordIndex + 1).map((word) => {
		return word.split(',')[0]
	})

	return [ title, ...otherInfo ]
}

const leadingZero = (n) => (String(n).length < 2 ? 0 + String(n) : n)

function downloadTorrents(magnetLinks) {
	// node_modules/webtorrent-cli/bin/cmd.js
	magnetLinks.forEach((link) => downloadTorrent(link))
}

function getEpisodes(info) {
	let [ title, season, firstEp, lastEp ] = info
	console.log('info', info)
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
				process.stdout.write(' Found!\n')
			} else console.log(`No results for season ${season} episode ${episode} :(`)

			if (episode < lastEpisode) {
				searchEpisode(title, season, episode + 1, lastEpisode, resolve, magnetLinks)
			} else {
				resolve(magnetLinks)
			}
		})
		.catch(console.error)
}

let info = getInfo()
getEpisodes(info)
