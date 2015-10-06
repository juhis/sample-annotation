var _ = require('lodash')
var request = require('request')
var async = require('async')
var fs = require('fs')

var infile = '../../data/2015_09_24_ENA.txt'

var lines = fs.readFileSync(infile, 'utf8').split(/\r?\n|\r/)
var studyCol = lines[0].split('\t').indexOf('study_accession')
if (studyCol < 0) {
    console.err('no study_accession column found!')
    process.exit(1)
}

var studies = {}
_.forEach(lines.slice(1), function(line) {
    var split = line.split('\t')
    if (split.length > 1) {
	var study = split[studyCol]
	studies[study] = true
    }
})

studies = _.keys(studies).sort()
console.log(_.size(studies) + ' study accessions')

if (!fs.existsSync('../../data/RunInfo')) {
    fs.mkdirSync('../../data/RunInfo')
}

var numDownloaded = 0
async.eachSeries(studies, function(study, callback) {

    if (fs.existsSync('../../data/RunInfo/' + study + '.csv')) {
	console.log(study + ' already downloaded')
	return callback(null)
    }
    var url = 'http://trace.ncbi.nlm.nih.gov/Traces/sra/sra.cgi?save=efetch&db=sra&rettype=runinfo&term=' + study
    request(url, function(err, resp, body) {
	if (!err && resp.statusCode === 200) {
	    fs.writeFileSync('../../data/RunInfo/' + study + '.csv', body, 'utf8')
	    console.log(study + ' downloaded')
	    numDownloaded++
	} else {
	    console.log(study + 'could not be downloaded: ' + err)
	}
	callback(null)
    })
}, function(err) {
    if (err) {
	return console.log(err)
    } else {
	return console.log('SRA run info downloaded')
    }
})
