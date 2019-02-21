const { search, checkIsUp, proxies } = require('piratebay-search')
const prompts = require('prompts')
const { downloadTorrent } = require('./DownloadTorrents')

class Movie {
	constructor() {
		this.getInfo().then(({ title }) => {
			this.searchTorrents(title)
		})
		this.currentPage = 0
		this.minSeeders = 2
		// minFileSize in MiB
		this.minFileSize = 1024
	}
	getFileSize(description) {
		let regExpGroups = /Size (\d*\.*\d*)\s(\w*)/.exec(description)
		if (regExpGroups) return regExpGroups.slice(1, 3)
		throw error('Error: regEx in getFileSize() failed')
	}
	getFileSizeInMiB({ description }) {
		let [ n, unit ] = this.getFileSize(description)

		let size = Number(n)
		if (unit === 'GiB') size *= 1024
		else if (unit === 'TiB') size *= 1048576
		else if (unit === 'KiB') size = 1

		return size
	}
	getNPages(nResults, pageLength) {
		const remainder = pageLength - nResults % pageLength
		const nPages = (nResults + remainder) / pageLength
		return nPages
	}
	async showPageOfTorrents(choices) {
		console.log('showing page of torrents', choices)
		let onSubmit = (prompt, response) => {
			if (response === 'next') this.nextPage()
			else if (response === 'prev') this.prevPage()
			else {
				console.log('Opening magnet link...')
				downloadTorrent(response)
			}
		}
		return await prompts(
			{
				type: 'select',
				name: 'torrent',
				message: "Select the torrent you'd like:",
				choices,
				initial: 0
			},
			{ onSubmit }
		)
	}
	nextPage() {
		this.currentPage++
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	prevPage() {
		this.currentPage++
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	async chooseTorrent(results) {
		const pageLength = 6
		const nResults = results.length
		const nextPageLink = { title: '[ Next Page ]', value: 'next' }
		const prevPageLink = { title: '[ Prev Page ]', value: 'prev' }

		this.pagesOfChoices = []
		let page = []
		for (let i = 0; i < results.length; i++) {
			const lastOfPage = i % pageLength === 0 && i > 0
			const lastOfChoices = i === nResults - 1
			const r = results[i]
			let choice = {
				title: `${this.getFileSize(r.description).join(' ')} | ${r.seeds}s | ${r.name}`,
				value: r.file
			}
			// add previous page link if top of page (but not the first page)
			if (page.length === 0 && i !== 0) page.push(prevPageLink)

			// push choice regardless
			page.push(choice)

			// push current page and clear it for the next one
			if (lastOfPage || lastOfChoices) {
				// if there's more pages, add a next page link
				if (!lastOfChoices) page.push(nextPageLink)
				this.pagesOfChoices.push(page)
				page = []
			}

			// push choice if not at the end of a page
			// if (i === 0 || i % pageLength !== 0) page.push(choice)
			// else {
			// 	page.push(choice)
			// 	// if there's more pages, add a next page link
			// 	if (i !== nResults - 1) page.push(nextPageLink)

			// 	// push current page and clear it for the next page
			// 	this.pagesOfChoices.push(page)
			// 	page = []
			// }
		}
		// console.log(this.pagesOfChoices)
		// need pages of 20 results each for choices, otherwise won't work
		// console.log('choices:', this.pagesOfChoices)
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	filterResults(results) {
		results = results.filter((r) => r.seeds >= this.minSeeders && this.getFileSizeInMiB(r) >= this.minFileSize)
		results = results.sort((a, b) => this.getFileSizeInMiB(b) - this.getFileSizeInMiB(a))
		this.chooseTorrent(results)
	}
	searchTorrents(title) {
		let results = []
		let minSeeders = this.minSeeders
		let promise = new Promise((resolve) => {
			function searchPage(n = 0) {
				console.log(`Searching page ${n + 1}...`)
				search(`${title}`, {
					baseURL: 'https://pirateproxy.cam',
					page: n
				}).then((res) => {
					if (res.length > 1 && res[0].seeds >= minSeeders) {
						results.push(...res)
						// only continue if last item is at or above minSeeders
						if (res[res.length - 1].seeds >= minSeeders) searchPage(n + 1)
						else resolve()
					} else resolve()
				})
			}
			searchPage()
		}).then(() => {
			if (results.length === 0) {
				console.log('No results :(')
			} else {
				this.filterResults(results)
			}
		})
	}
	async getInfo() {
		// idea: for initial value pick a random movie from IMDB's top 200 movies
		return await prompts({
			type: 'text',
			name: 'title',
			message: 'What is the title of the movie?',
			validate: (name) => (name.length < 2 ? 'You must provide the title of the movie.' : true)
		})
	}
}

module.exports = { Movie }
