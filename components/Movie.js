const { search, checkIsUp, proxies } = require('piratebay-search')
const prompts = require('prompts')
const { download } = require('./DownloadTorrents')
const { PromptUser } = require('./PromptUser')

class Movie {
	constructor(title, sortBySeeders) {
		this.title = title
		this.minSeeders = 2
		this.minFileSize = 1
		this.maxFileSize = 30
		this.sortBy = sortBySeeders ? 'seeders' : 'fileSizeSeeders'
		this.sortOrder = 'descending'
		this.resultsPageLength = 16

		this.currentPage = 0

		if (this.title) this.searchTorrents()
		else
			new PromptUser().askAll(sortBySeeders).then((searchInfo) => {
				Object.assign(this, searchInfo)
				this.searchTorrents()
			})
	}
	async searchTorrents() {
		let title = this.title
		let minSeeders = this.minSeeders
		let results = []

		await new Promise((resolve) => {
			function searchPage(pageN = 0) {
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
		})

		results.length === 0 ? console.log('No results :(') : this.chooseTorrent(this.filterResults(results))
	}
	getFileSizeString({ description }) {
		return /Size (\d*\.*\d*)\s(\w*)/.exec(description).slice(1, 3)
	}
	getFileSizeInGB({ description }) {
		// must repeat code due to this function being called within sort() in filterResults() where 'this' doesn't work
		let [ n, unit ] = /Size (\d*\.*\d*)\s(\w*)/.exec(description).slice(1, 3)

		let size = Number(n)
		if (unit === 'KiB') size *= 0.0000009765625
		else if (unit === 'MiB') size *= 0.0009765625
		else if (unit === 'GiB') size *= 0.9765625
		else if (unit === 'TiB') size *= 976.5625

		return size
	}
	getUploadDateString({ description }) {
		return description.match(/\d\d-\d\d\s\d{4}/)
	}
	getUploadDate({ description }) {
		let [ month, day, year ] = /(\d\d)-(\d\d)\s(\d{4})/.exec(description).slice(1)
		// let date =
		return new Date().setFullYear(year, month, day)
	}
	getFileSizeCategory({ description }) {
		function getFileSizeInGB(description) {
			let [ n, unit ] = /Size (\d*\.*\d*)\s(\w*)/.exec(description).slice(1, 3)
			let size = Number(n)
			if (unit === 'KiB') size *= 0.0000009765625
			else if (unit === 'MiB') size *= 0.0009765625
			else if (unit === 'GiB') size *= 0.9765625
			else if (unit === 'TiB') size *= 976.5625
			return size
		}
		function getCategory(fileSize) {
			// 10-30 GB// 5-10 GB// 2-5 GB// 1-2 GB// 500+ MB// 200+ MB// 100+ MB// < 100 M
			let categories = [ 0.1, 0.2, 0.5, 1, 2, 3, 5, 7, 10, 15 ]
			let category
			for (let i = 0; i < categories.length; i++) {
				let currentCategory = categories[i]
				if (fileSize < currentCategory) {
					category = currentCategory
					break
				}
			}
			// if greater than last category, make new max category
			return category || categories[categories.length - 1] + 1
		}
		let fileSize = getFileSizeInGB(description)
		return getCategory(fileSize)
	}
	async showPageOfTorrents(choices) {
		// move onSubmit out to this.onSubmit
		let onSubmit = (prompt, response) => {
			if (response === 'next') this.nextPage()
			else if (response === 'prev') this.prevPage()
			else {
				download.single(response)
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
				title:
					this.getFileSizeString(r).join(' ') +
					` | ${r.seeds}s | ${r.name.trim()} | ` +
					this.getUploadDateString(r),
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
		results = results.filter(
			(r) =>
				r.seeds >= this.minSeeders &&
				this.getFileSizeInGB(r) >= this.minFileSize &&
				this.getFileSizeInGB(r) <= this.maxFileSize
		)
		if (this.sortBy === 'seeders') return results
		else if (this.sortBy === 'fileSizeSeeders') {
			const getFileSizeCategory = this.getFileSizeCategory
			const getFileSize = this.getFileSizeInGB
			let sortFunction
			if (this.sortOrder === 'ascending') {
				sortFunction = (a, b) => {
					const aSizeCat = getFileSizeCategory(a)
					const aSize = getFileSize(a)
					const bSizeCat = getFileSizeCategory(b)
					const bSize = getFileSize(b)
					if (aSizeCat === bSizeCat && a.seeds === b.seeds) return aSize - bSize
					else return aSizeCat - bSizeCat
				}
			} else {
				sortFunction = (a, b) => {
					const aSizeCat = getFileSizeCategory(a)
					const aSize = getFileSize(a)
					const bSizeCat = getFileSizeCategory(b)
					const bSize = getFileSize(b)
					if (aSizeCat === bSizeCat && a.seeds === b.seeds) return bSize - aSize
					else return bSizeCat - aSizeCat
				}
			}
			return results.sort(sortFunction)
		} else {
			let sortValue = (this.sortBy = 'fileSize' ? this.getFileSizeInGB : this.getUploadDate)
			const sortFunction =
				this.sortOrder === 'ascending'
					? (a, b) => sortValue(a) - sortValue(b)
					: (a, b) => sortValue(b) - sortValue(a)

			return results.sort(sortFunction)
		}
	}
}

module.exports = { Movie }
