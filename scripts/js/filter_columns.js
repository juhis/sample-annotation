var _ = require('lodash')
var fs = require('fs')

var infile = '../../data/2015_09_24_ENA_with_SRA_ArrayExpress.txt'
var outfile = '../../data/2015_09_24_ENA_with_SRA_ArrayExpress_filtered_columns.txt'
var columns = _.compact(fs.readFileSync('../../data/2015_09_24_ENA_with_SRA_ArrayExpress_wanted_columns.txt', 'utf8').split(/\r?\n|\r/))

var lines = fs.readFileSync(infile, 'utf8').split(/\r?\n|\r/)
var headers = lines[0].split('\t')
var colNums = []
for (var i = 0; i < headers.length; i++) {
    if (_.includes(columns, headers[i])) {
	colNums.push(i)
    }
}
console.log(columns.length + ' columns wanted, ' + colNums.length + ' found')

var newLines = _.compact(_.map(lines, function(line) {
    var fields = line.split('\t')
    if (fields.length > 1) {
	var newLine = ''
	var sep = ''
	for (var i = 0; i < colNums.length; i++) {
	    newLine += sep
	    newLine += fields[colNums[i]]
	    sep = '\t'
	}
	return newLine
    } else {
	return false
    }
}))

if (newLines.length != lines.length - 1) {
    console.log('file contained empty lines!')
}

fs.writeFileSync(outfile, newLines.join('\n') + '\n', 'utf8')
