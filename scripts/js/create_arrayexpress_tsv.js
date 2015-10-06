var _ = require('lodash')
var fs = require('fs')
var split = require('split')

var infile = '../../data/2015_09_24_ENA_with_SRA.txt'
var infileArrayExpress = '../../data/ArrayExpressRuns.json'
var outfile = '../../data/2015_09_24_ENA_with_SRA_ArrayExpress.txt'

var aeData = JSON.parse(fs.readFileSync(infileArrayExpress, 'utf8'))

var wanted = ['SOURCE', 'DESCRIPTION', 'ORGANISM', 'TISSUE', 'CELL_TYPE', 'CELL_LINE', 'SAMPLE_TITLE', 'SAMPLE_CHARACTERISTICS', 'TUMOR', 'CANCER']
var fields = {}
var cleanData = {}
_.forEach(aeData, function(value, runId) {
    cleanData[runId] = {}
    _.forEach(value, function(v, field) {
	field = 'ARRAYEXPRESS_' + field.replace(/ /g, '_')
	var ok = false
	_.forEach(wanted, function(word) {
	    if (field.indexOf(word) > -1 && field.indexOf('FACTOR') < 0) {
		ok = true
		return false
	    }
	})
	if (ok) {
	    cleanData[runId][field] = v.replace('\t', '|')
	    fields[field] = true
	}
    })
})

console.log(_.size(fields) + ' unique fields in data')

var fhOut = fs.openSync(outfile, 'w')

var aeHeaders = _.keys(fields)
var headers = null
var numLines = 0
fs.createReadStream(infile)
    .pipe(split())
    .on('data', function(line) {
	if (numLines % 5000 === 0) {
	    console.log(numLines + ' lines written')
	}
	if (numLines === 0) {
	    fs.writeSync(fhOut, line + '\t' + aeHeaders.join('\t') + '\n', 'utf8')
	    headers = line.split('\t')
	    runCol = headers.indexOf('run_accession')
	    runCol2 = headers.indexOf('experiment_alias')
	    if (runCol < 0) {
		console.error('no run_accession column found, aborting!')
		process.exit(1)
	    }
	    if (runCol2 < 0) {
		console.error('no experiment_alias column found, aborting!')
		process.exit(1)
	    }
	} else {
	    if (line.length > 1) {
		fs.writeSync(fhOut, line)
		var split = line.split('\t')
		for (var i = split.length; i < headers.length; i++) { // fill remaining tabs so sra data go to correct columns
		    fs.writeSync(fhOut, '\t')
		}
		var data = cleanData[split[runCol]]
		if (!data && split[runCol2] && split[runCol2].indexOf('GSM') == 0) {
		    var gsm = split[runCol2]
		    if (gsm && gsm.indexOf(':') > 0) {
			gsm = gsm.substring(0, gsm.indexOf(':'))
		    }
		    if (gsm) {
			data = cleanData[gsm]
		    }
		}
		_.forEach(aeHeaders, function(h) {
		    fs.writeSync(fhOut, '\t' + ((data && data[h]) || ''))
		})
		fs.writeSync(fhOut, '\n')
	    }
	}
	++numLines
    })
