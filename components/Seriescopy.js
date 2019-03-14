const prompts = require('prompts')
const { search, checkIsUp, proxies } = require('piratebay-search')
const { download } = require('./DownloadTorrents')

class Series {
	constructor(title) {
		this.title = title
		this.getInfo().then((info) => this.getEpisodes(info))
	}
	async getInfo() {
		let questions = [
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

		let askTitle = {
			type: 'text',
			name: 'title',
			message: 'What is the name of the series?',
			validate: (name) => (name.length < 2 ? 'You must provide the name of the series.' : true)
		}

		if (!this.title) questions.unshift(askTitle)

		prompts(questions).then((response) => {
			if (this.title) response.title = this.title
			console.log(response)
		})
	}
	getEpisodes(info) {
		let { title, season, firstEp, lastEp } = info
		new Promise((resolve) => {
			this.searchEpisode(title, Number(season), Number(firstEp), Number(lastEp), resolve)
		}).then((result) => download.torrents(result))
	}
	searchEpisode(title, season, episode, lastEpisode, resolve, magnetLinks = []) {
		const leadingZero = (n) => (String(n).length < 2 ? 0 + String(n) : n)

		let searchQuery = `${title} s${leadingZero(season)}e${leadingZero(episode)}`

		process.stdout.write(`Searching for episode ${episode}...`)
		console.log(`\n ${title}`)
		search(searchQuery, {
			link: 'https://thehiddenbay.com'
		})
			.then((res) => {
				let result = res[0]

				if (result) {
					magnetLinks.push(result.file)
					if (result.seeds < 1) process.stdout.write(` Found, but no seeds :(\n`)
					else process.stdout.write(` Found! Seeds: ${result.seeds}\n`)
				} else process.stdout.write(` Couldn't find it :(\n`)

				if (episode < lastEpisode) {
					this.searchEpisode(title, season, episode + 1, lastEpisode, resolve, magnetLinks)
				} else {
					resolve(magnetLinks)
				}
			})
			.catch(console.error)
	}
}

module.exports = { Series }
