const { exec } = require('child_process')
const prompts = require('prompts')

class Download {
	constructor() {}
	torrent(magnetLink) {
		exec(`open "${magnetLink}"`, (err, stdout, stderr) => {
			console.log(stdout)
			if (err) console.log('Error:\n', stderr)
		})
	}
	torrents(magnetLinks) {
		magnetLinks.forEach((link) => this.torrent(link))
	}
}

const download = new Download()

module.exports = { download }
