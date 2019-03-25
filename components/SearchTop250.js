const { search, checkIsUp, proxies } = require('piratebay-search')

const getTop250 = require('./GetTop250')

async function searchTitle(title) {
	title = title.replace(/[^\w\s]/, '')
	const results = []
	const minSeeders = 4
	await new Promise((resolve) => {
		function searchPage(pageN = 0) {
			search(title, {
				baseURL: 'https://thepiratebay.org',
				page: pageN
			}).then((res) => {
				if (res[0] && res.length > 1 && res[0].seeds >= minSeeders) {
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
	console.log(title, results.length)
	searched++
	if (searched === 250) {
		console.timeEnd('searchFor250')
		console.timeEnd('total')
	}
	return results
}

console.time('get250List')
console.time('total')
let searched = 0
let thirtyResults = 0

getTop250().then((top250) => {
	console.timeEnd('get250List')
	console.time('searchFor250')
	for (let i = 0; i < top250.length; i++) {
		let m = top250[i]
		let title = m.name
		let year = m.year
		searchTitle(`${title} ${year}`)
	}
})
