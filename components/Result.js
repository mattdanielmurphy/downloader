class Result {
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
}

let result = new Result()

module.exports = { result }
