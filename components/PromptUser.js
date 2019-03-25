const prompts = require('prompts')

class PromptUser {
	constructor() {
		this.filters = {
			maxFileSize: 30
		}
	}
	async askAll(sortBy) {
		await this.askTitle()
		await this.askMinSeeders()
		await this.askMinFileSize()
		if (sortBy) this.sortBy = sortBy
		else await this.askSortBy()
		if (this.sortBy !== 'seeders') await this.askSortOrder()
		return { ...this }
	}
	async askTitle() {
		return await prompts({
			type: 'text',
			name: 'title',
			message: 'What is the title of the movie?',
			validate: (name) => (name.length < 2 ? 'You must provide the title of the movie.' : true)
		}).then(({ title }) => (this.title = title))
	}
	async askMinSeeders() {
		return await prompts({
			type: 'number',
			name: 'minSeeders',
			message: 'Minimum seeders: (default: 2)',
			min: 1,
			initial: 2
		}).then(({ minSeeders }) => (this.filters.minSeeders = minSeeders))
	}
	async askMinFileSize() {
		return await prompts({
			type: 'number',
			name: 'minFileSize',
			message: 'Minimum file size: (in GB, default: 1)',
			min: 0,
			increment: 0.1,
			initial: 1
		}).then(({ minFileSize }) => (this.filters.minFileSize = minFileSize))
	}
	async askSortBy() {
		return await prompts({
			type: 'select',
			name: 'sortBy',
			message: 'How shall I sort your results?',
			choices: [
				{ title: 'File Size - Seeders', value: 'fileSizeSeeders' },
				{ title: 'File Size', value: 'fileSize' },
				{ title: 'Seeders', value: 'seeders' },
				{ title: 'Upload Date', value: 'uploadDate' }
			],
			initial: 0
		}).then(({ sortBy }) => (this.sortBy = sortBy))
	}
	async askSortOrder() {
		return await prompts({
			type: 'select',
			name: 'sortOrder',
			message: '...in which order?',
			choices: [ { title: 'Descending', value: 'descending' }, { title: 'Ascending', value: 'ascending' } ],
			initial: 0
		}).then(({ sortOrder }) => (this.sortOrder = sortOrder))
	}
}

exports.PromptUser = PromptUser
