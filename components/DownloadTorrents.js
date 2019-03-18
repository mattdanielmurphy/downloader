const { exec } = require('child_process')

class Download {
	constructor() {}
	open(magnetLink) {
		exec(`open "${magnetLink}"`, (err, stdout, stderr) => (err ? console.log('Error:\n', stderr) : null))
	}
	single(magnetLink) {
		console.log(`\nOpening magnet link...\n(requires a supporting bittorrent client)`)
		setTimeout(() => this.open(magnetLink), 500)
	}
	series(magnetLinks) {
		console.log(`\nOpening magnet links...\n(requires a supporting bittorrent client)`)
		setTimeout(() => magnetLinks.forEach((link) => this.open(link)), 500)
	}
}

const download = new Download()

module.exports = { download }
