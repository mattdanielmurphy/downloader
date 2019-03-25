var rp = require('request-promise')
var cheerio = require('cheerio')

async function getTop250() {
	let top250 = []
	await rp('http://www.imdb.com/chart/top').then((html) => {
		const $ = cheerio.load(html, {})
		$('.seen-collection').filter(function() {
			const tableRow = $(this).find('.lister-list').find('tr')
			tableRow.each(function(i) {
				const self = $(this)
				const poster = self.find('.posterColumn').find('a').find('img').attr('src')
				const name = self.find('.titleColumn').find('a').text().trim()
				const year = self.find('.titleColumn').find('.secondaryInfo').text().split(')')[0].split('(')[1].trim()
				const rating = self.find('.ratingColumn').find('strong').text()

				const data = {
					index: i,
					name,
					year,
					rating,
					poster
				}

				top250.push(data)
			})
		})
	})
	return top250
}

module.exports = getTop250
