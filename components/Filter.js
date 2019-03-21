const { result } = require('./Result')

class Filter {
	constructor(results, { minFileSize, maxFileSize, minSeeders }) {
		this.results = results
		this.minFileSize = minFileSize
		this.maxFileSize = maxFileSize
		this.minSeeders = minSeeders

		return this.filterResults()
	}
	sortByFileSizeSeeders() {
		const getFileSizeCategory = result.getFileSizeCategory
		const getFileSize = result.getFileSizeInGB
		function getSortFunction(order) {
			return function sortFunction(a, b) {
				const aSizeCat = getFileSizeCategory(a)
				const bSizeCat = getFileSizeCategory(b)
				const aSize = getFileSize(a)
				const bSize = getFileSize(b)
				if (aSizeCat === bSizeCat && a.seeds === b.seeds)
					return order === 'ascending' ? aSize - bSize : bSize - aSize
				else return order === 'ascending' ? aSizeCat - bSizeCat : bSizeCat - aSizeCat
			}
		}
		return this.results.sort(getSortFunction(this.sortOrder))
	}
	sortResults() {
		let sortValue = (this.sortBy = 'fileSize' ? result.getFileSizeInGB : result.getUploadDate)
		const sortFunction =
			this.sortOrder === 'ascending'
				? (a, b) => sortValue(a) - sortValue(b)
				: (a, b) => sortValue(b) - sortValue(a)

		return this.results.sort(sortFunction)
	}
	filterResults() {
		this.results = this.results.filter(
			(r) =>
				r.seeds >= this.minSeeders &&
				result.getFileSizeInGB(r) >= this.minFileSize &&
				result.getFileSizeInGB(r) <= this.maxFileSize
		)
		if (this.sortBy === 'seeders') return this.results
		else if (this.sortBy === 'fileSizeSeeders') return this.sortByFileSizeSeeders()
		else return this.sortResults()
	}
}

module.exports = { Filter }
