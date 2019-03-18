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
				'\nTip: Run "pirateer <title>" to search for a movie with default settings.\nSee more with "pirateer help"\n'
		)
	}
	help() {
		console.log(`${logo}
Usage:
    pirateer <options> <title>
    
Examples:
    pirateer the big lebowski
    pirateer -s little house on the prairie

Options:
      -t      download TV series
      -s      sort by seeders (movies only)

Commands:
    help      display this help page
	`)
	}
}

module.exports = { Message }
