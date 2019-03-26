const { exec } = require('child_process')
const clipboardy = require('clipboardy')

class Download {
	constructor() {}
	open(magnetLink) {
		exec(`open "${magnetLink}"`, (err, stdout, stderr) => (err ? console.log('Error:\n', stderr) : process.exit(0)))
	}
	async single(magnetLink, clipboardMagnetLinks) {
		if (clipboardMagnetLinks) {
			await clipboardy.writeSync(magnetLink)
			console.log('Magnet link copied to clipboard.')
		} else {
			console.log(`\nOpening magnet link...\n(requires a supporting bittorrent client)`)
			setTimeout(() => this.open(magnetLink), 500)
		}
	}
	series(magnetLinks) {
		console.log(`\nOpening magnet links...\n(requires a supporting bittorrent client)`)
		setTimeout(() => magnetLinks.forEach((link) => this.open(link)), 500)
	}
}

const download = new Download()

module.exports = { download }
