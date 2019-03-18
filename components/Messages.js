const logo = `       _          _
  _ __(_)_ _ __ _| |_ ___ ___ _ _ 
 | '_ \\ | '_/ _\` |  _/ -_) -_) '_|
 | .__/_|_| \\__,_|\\__\\___\\___|_|  
 |_|
`

class Message {
	welcome() {
		console.log(
			logo +
				'\nTip: Run "pirateer <title>" to search for a movie with default settings. See more with "pirateer help"\n'
		)
	}
	help() {
		console.log(`${logo}
Usage:
    pirateer <options> <title>
    
Example:
    pirateer --series little house on the prairie

Options:
		--series  download TV series
	`)
	}
}

module.exports = { Message }
