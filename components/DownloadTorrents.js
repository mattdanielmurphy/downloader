const { exec } = require('child_process')
const prompts = require('prompts')
const fs = require('fs')
const path = require('path')
const node_ssh = require('node-ssh')
const ssh = new node_ssh()
const { host, username, password } = require('../ssh-info')
const parseTorrent = require('parse-torrent')

var magnet =
	'magnet:?xt=urn:btih:addb585ecb1324480ae775f0f79a7d9094f1d3a0&dn=Dodgeball+A+True+Underdog+Story+(2004)+%5B1080p%5D&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com'

let hash = parseTorrent(magnet).infoHash

async function connect() {
	console.log(hash)
	ssh.connect({ host, username, password }).then(() => {
		ssh
			.execCommand(
				`/cygdrive/c/Program\\ Files/nodejs/node.exe ./wt/node_modules/webtorrent-cli/bin/cmd.js download ${hash}`,
				{ cwd: '/var/www' }
			)
			.then(({ stdout, stderr }) => {
				if (stderr) console.log('STDERR: ' + stderr)
				else console.log('STDOUT: ' + stdout)
			})
	})
}

module.exports = {
	downloadTorrent(magnetLink) {
		prompts(
			{
				type: 'select',
				name: 'destination',
				message: 'Where shall I download this file?',
				choices: [ { title: 'Here', value: 'local' }, { title: 'Media Server PC', value: 'ssh' } ]
			},
			{
				onSubmit: (prompt, response) => {
					console.log(response)
				}
			}
		).then(() => {
			connect()
		})
		// exec(`open ${magnetLink}`, (err, stdout, stderr) => {
		// 	if (err) console.log('Error:\n', stderr)
		// })
	},
	downloadTorrents(magnetLinks) {
		// node_modules/webtorrent-cli/bin/cmd.js
		magnetLinks.forEach((link) => this.downloadTorrent(link))
	}
	// ask if you want to download here or to PC
}
