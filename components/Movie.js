const { search, checkIsUp, proxies } = require('piratebay-search')
const prompts = require('prompts')
const { download } = require('./DownloadTorrents')

class Movie {
	constructor() {
		this.resultsPageLength = 16
		this.currentPage = 0

		this.getInfo().then(() => this.searchTorrents())
		this.filteredResults = []
	}
	getFileSize(description) {
		let regExpGroups = /Size (\d*\.*\d*)\s(\w*)/.exec(description)
		if (regExpGroups) return regExpGroups.slice(1, 3)
		throw error('Error: regEx in getFileSize() failed')
	}
	getFileSizeInGB({ description }) {
		let [ n, unit ] = this.getFileSize(description)

		let size = Number(n)
		if (unit === 'KiB') size *= 0.0000009765625
		else if (unit === 'MiB') size *= 0.0009765625
		else if (unit === 'GiB') size *= 0.9765625
		else if (unit === 'TiB') size *= 976.5625

		return size
	}
	async showPageOfTorrents(choices) {
		// move onSubmit out to this.onSubmit
		let onSubmit = (prompt, response) => {
			if (response === 'next') this.nextPage()
			else if (response === 'prev') this.prevPage()
			else {
				console.log('Opening magnet link...')
				download.torrent(response)
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
		//
		//
		//
		//
		// change next page link to always be there if more applicable results (lastResultHasMinSeeds)
		// if no more filtered results, make nextpage link load more results
		//
		//
		//
		//
		//
		// console.log(this.pagesOfChoices[this.currentPage + 1])
		this.currentPage++
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	prevPage() {
		this.currentPage--
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	async chooseTorrent(results) {
		const nResults = results.length
		const nextPageLink = { title: '[ Next Page ]', value: 'next' }
		const prevPageLink = { title: '[ Prev Page ]', value: 'prev' }

		this.pagesOfChoices = []
		let page = []
		for (let i = 0; i < results.length; i++) {
			const lastOfPage = i % this.resultsPageLength === 0 && i > 0
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
		}
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	filterResults(results) {
		return results
			.filter((r) => r.seeds >= this.minSeeders && this.getFileSizeInGB(r) >= this.minFileSize)
			.sort((a, b) => this.getFileSizeInGB(b) - this.getFileSizeInGB(a))
	}
	searchTorrents() {
		let title = this.title
		let minSeeders = this.minSeeders
		let results = []
		let lastPageSearched = 0
		new Promise((resolve) => {
			const searchPage = (pageN = 0) => {
				console.log(`Searching page ${pageN + 1}...`)
				console.log(title)
				search(title, {
					baseURL: 'https://thepiratebay.org',
					page: pageN
				}).then((res) => {
					const firstResultHasMinSeeds = res[0].seeds >= minSeeders
					if (res.length > 1 && firstResultHasMinSeeds) {
						results.push(...res)
						// only continue if last item is at or above minSeeders
						// console.log('filtered results not this', this.filterResults(results))
						this.filteredResults.push(...this.filterResults(results))
						const lastResultHasMinSeeds = res[res.length - 1].seeds >= minSeeders
						// const notEnoughForFullPage = this.resultsPageLength - this.filteredResults.length % this.resultsPageLength !== 0
						const notEnoughForFullPage = this.filteredResults.length < this.resultsPageLength * pageN + 1

						if (lastResultHasMinSeeds && notEnoughForFullPage) searchPage(pageN + 1)
						else resolve()
					} else resolve()
				})
			}
			searchPage()
		}).then(() => {
			if (results.length === 0) console.log('No results :(')
			else this.chooseTorrent(this.filteredResults)
		})
	}
	async askTitle() {
		return await prompts({
			type: 'text',
			name: 'title',
			message: 'What is the title of the movie?',
			validate: (name) => (name.length < 2 ? 'You must provide the title of the movie.' : true)
		}).then(({ title }) => (this.title = title))
	}
	async askMinSeeders() {
		return await prompts({
			type: 'number',
			name: 'minSeeders',
			message: 'Minimum seeders: (default: 2)',
			min: 1,
			initial: 2
		}).then(({ minSeeders }) => (this.minSeeders = minSeeders))
	}
	async askMinFileSize() {
		return await prompts({
			type: 'number',
			name: 'minFileSize',
			message: 'Minimum file size: (in GB, default: 1)',
			min: 0,
			increment: 0.1,
			initial: 1
		}).then(({ minFileSize }) => (this.minFileSize = minFileSize))
	}
	async getInfo() {
		// idea: for initial value pick a random movie from IMDB's top 200 movies
		await this.askTitle()
		await this.askMinSeeders()
		await this.askMinFileSize()
	}
}

module.exports = { Movie }
