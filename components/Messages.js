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
    - pirateer the big lebowski
    - pirateer -t little house on the prairie

Options:
      -t      search for TV series
      -s      sort by seeders (movies only)
      -c      copy magnet link to clipboard rather than opening it (movies only)

Commands:
    help      display this help page
	`)
	}
}

module.exports = { Message }
