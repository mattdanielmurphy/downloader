const { search, checkIsUp, proxies } = require('piratebay-search')
const prompts = require('prompts')
const { download } = require('./DownloadTorrents')

class Movie {
	constructor() {
		this.resultsPageLength = 16
		this.currentPage = 0

		this.sortOrder = 'descending'
		this.getInfo().then(() => this.searchTorrents())
		this.filteredResults = []
	}
	getFileSize(description) {
		let regExpGroups = /Size (\d*\.*\d*)\s(\w*)/.exec(description)
		if (regExpGroups) return regExpGroups.slice(1, 3)
		throw error('Error: regEx in getFileSize() failed')
	}
	getFileSizeInGB({ description }) {
		// deeply saddened to have to repeat this code but I must due to this function
		// being called from sort() in filterResults()... 'this' doesn't work here
		function getFileSize(description) {
			let regExpGroups = /Size (\d*\.*\d*)\s(\w*)/.exec(description)
			if (regExpGroups) return regExpGroups.slice(1, 3)
			throw error('Error: regEx in getFileSize() failed')
		}
		let [ n, unit ] = thisA.getFileSize(description)

		let size = Number(n)
		if (unit === 'KiB') size *= 0.0000009765625
		else if (unit === 'MiB') size *= 0.0009765625
		else if (unit === 'GiB') size *= 0.9765625
		else if (unit === 'TiB') size *= 976.5625

		return size
	}
	getUploadDate({ description }) {
		let regExpGroups = /(\d\d)-(\d\d)\s(\d\d\d\d)/.exec(description)
		if (!regExpGroups) throw error('Error: regEx in getUploadDate() failed')
		console.log(regExpGroups)
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
		// change next page link to always be there if more applicable results (lastResultHasMinSeeds)
		// if no more filtered results, make nextpage link load more results
		//
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
		results = results.filter((r) => r.seeds >= this.minSeeders && this.getFileSizeInGB(r) >= this.minFileSize)
		if (this.sortBy === 'seeders') return results
		else {
			let sortValue = this.sortBy === 'fileSize' ? this.getFileSizeInGB : this.getUploadDate
			console.log(this.sortOrder, sortValue, sortValue(results[0]))
			let thisA = this
			let sortFunction =
				this.sortOrder === 'ascending'
					? (a, b) => sortValue(a) - sortValue(b)
					: (a, b) => sortValue(b) - sortValue(a)

			return results.sort(sortFunction)
		}
	}
	searchTorrents() {
		let title = this.title
		let minSeeders = this.minSeeders
		let results = []
		let lastPageSearched = 0
		new Promise((resolve) => {
			const searchPage = (pageN = 0) => {
				console.log(`Searching page ${pageN + 1}...`)
				search(title, {
					baseURL: 'https://thepiratebay.org',
					page: pageN
				}).then((res) => {
					const firstResultHasMinSeeds = res[0].seeds >= minSeeders
					if (res.length > 1 && firstResultHasMinSeeds) {
						results.push(...res)
						// only continue if last item is at or above minSeeders
						const lastResultHasMinSeeds = res[res.length - 1].seeds >= minSeeders

						if (lastResultHasMinSeeds) searchPage(pageN + 1)
						else resolve()
					} else resolve()
				})
			}
			searchPage()
		}).then(() => {
			if (results.length === 0) console.log('No results :(')
			else this.chooseTorrent(this.filterResults(results))
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
	async askSortBy() {
		return await prompts({
			type: 'select',
			name: 'sortBy',
			message: 'How shall I sort your results?',
			choices: [
				{ title: 'File Size', value: 'fileSize' },
				{ title: 'Seeders', value: 'seeders' },
				{ title: 'Date Uploaded', value: 'dateUploaded' }
			],
			initial: 0
		}).then(({ sortBy }) => (this.sortBy = sortBy))
	}
	async askSortOrder() {
		return await prompts({
			type: 'select',
			name: 'sortOrder',
			message: '...in which order?',
			choices: [ { title: 'Descending', value: 'descending' }, { title: 'Ascending', value: 'ascending' } ],
			initial: 0
		}).then(({ sortOrder }) => (this.sortOrder = sortOrder))
	}
	async getInfo() {
		// idea: for initial value pick a random movie from IMDB's top 200 movies
		await this.askTitle()
		await this.askMinSeeders()
		await this.askMinFileSize()
		await this.askSortBy()
		if (this.sortBy !== 'seeders') await this.askSortOrder()
	}
}

module.exports = { Movie }
