const prompts = require('prompts')
const { download } = require('./DownloadTorrents')

class ShowTorrents {
	constructor(pagesOfChoices, clipboardMagnetLinks) {
		this.pagesOfChoices = pagesOfChoices
		this.clipboardMagnetLinks = clipboardMagnetLinks
		this.currentPage = 0
		this.initalPage()
	}
	initalPage() {
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	nextPage() {
		this.currentPage++
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	prevPage() {
		this.currentPage--
		this.showPageOfTorrents(this.pagesOfChoices[this.currentPage])
	}
	async showPageOfTorrents(choices) {
		// cannot move to this.onSubmit
		const onSubmit = (prompt, response) => {
			if (response === 'next') this.nextPage()
			else if (response === 'prev') this.prevPage()
			else download.single(response, clipboardMagnetLinks)
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
}

module.exports = { ShowTorrents }
