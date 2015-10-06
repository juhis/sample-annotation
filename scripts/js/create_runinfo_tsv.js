var _ = require('lodash')
var fs = require('fs')
var async = require('async')
var splitter = require('split')
var csv = require('csv')

var infile = '../../data/2015_09_24_ENA.txt'
var outfile = '../../data/2015_09_24_ENA_with_SRA.txt'
var sraFiles = fs.readdirSync('../../data/RunInfo')

var hash = {}
var sraHeaders = null

console.log('parsing...')
async.eachSeries(sraFiles, function(file, cb) {
    var content = fs.readFileSync('./RunInfo/' + file, 'utf8')
    if (content.indexOf('Run') === 0) {
	csv.parse(content, function(err, data) {
	    if (err) return cb(err)
	    sraHeaders = _.map(data[0], function(header) { return 'SRA_' + header.replace(' ', '_') })
	    _.forEach(data.slice(1), function(sampleData) {
		if (sampleData.length > 1) {
		    hash[sampleData[0]] = sampleData.slice(1)
		    if (sampleData.length != sraHeaders.length) {
			console.log('error ' + sampleData[0] + ' in ' + file)
		    }
		}
	    })
	    cb()
	})
    } else {
	cb()
    }
}, function(err) {
    if (err) return console.log(err)
    console.log(_.size(hash) + ' samples with information in Sequence Read Archive')
    
    var emptyData = _.map(sraHeaders, function(h) { return '' })
    
    var fhOut = fs.openSync(outfile, 'w')
    var numLines = 0
    var headers = null
    var samples = {}
    fs.createReadStream(infile)
	.pipe(splitter())
	.on('data', function(line) {
	    if (numLines % 5000 === 0) {
		console.log(numLines + ' lines written')
	    }
	    if (numLines === 0) {
		fs.writeSync(fhOut, line + '\t' + sraHeaders.slice(1).join('\t') + '\n', 'utf8')
		headers = line.split('\t')
		runCol = headers.indexOf('run_accession')
		if (runCol < 0) {
		    console.error('no run_accession column found!')
		    process.exit(1)
		}
	    } else {
		var split = line.split('\t')
		if (split.length > 1) {
		    var sraData = hash[split[runCol]]
		    fs.writeSync(fhOut, line)
		    for (var i = split.length; i < headers.length + 1; i++) { // fill remaining tabs so sra data go to correct columns
			fs.writeSync(fhOut, '\t')
		    }
		    if (sraData != undefined) {
			fs.writeSync(fhOut, sraData.join('\t'), 'utf8')
			samples[split[runCol]] = true
		    } else {
			fs.writeSync(fhOut, emptyData.join('\t'), 'utf8')
		    }
		    fs.writeSync(fhOut, '\n', 'utf8')
		}
	    }
	    ++numLines
	})
	.on('end', function() {
            console.log(_.size(samples) + ' samples\' SRA annotation added, written to ' + outfile)
	})
})
