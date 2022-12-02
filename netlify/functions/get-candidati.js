const moment = require('moment')

exports.handler = async function (event, context) {

	const devs = [
		['Niccolò Bergamini', 'Enzo Garofalo'],
		['Fabio Ceschi', 'Daniele Colombo'],
		['Luca Ambrosi', 'Leonardo Piccoli'],
		['Fabio Merzi', 'Dinu Berinde'],
	]

	const prettify = (output) => JSON.stringify(output, null, 4)

	return {
		statusCode: 200,
		body: prettify(devs[moment().week() % devs.length])
	}
}
