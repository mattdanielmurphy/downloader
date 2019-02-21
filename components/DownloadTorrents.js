const { exec } = require('child_process')

module.exports = {
	downloadTorrent(magnetLink) {
		exec(`open ${magnetLink}`, (err, stdout, stderr) => {
			if (err) console.log('Error:\n', stderr)
		})
	},
	downloadTorrents(magnetLinks) {
		// node_modules/webtorrent-cli/bin/cmd.js
		magnetLinks.forEach((link) => this.downloadTorrent(link))
	}
}
