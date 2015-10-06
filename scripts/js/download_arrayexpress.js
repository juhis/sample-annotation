var _ = require('lodash')
var request = require('request')
var async = require('async')
var fs = require('fs')

var infile = '../../data/2015_09_24_ENA_with_SRA.txt'
var outfileStudies = '../../data/ArrayExpressStudies.json'
var outfileRuns = '../../data/ArrayExpressRuns.json'

var lines = fs.readFileSync(infile, 'utf8').split(/\r?\n|\r/)
var studyCol = lines[0].split('\t').indexOf('study_alias')
if (studyCol < 0) {
    console.err('no study_alias column found in ' + infile)
    process.exit(1)
}

var studies = {}
_.forEach(lines.slice(1), function(line) {
    var split = line.split('\t')
    if (split.length > 1) {
	var study = split[studyCol]
	if (study.indexOf('GSE') === 0) {
	    study = study.replace('GSE', 'E-GEOD-')
	}
	if (study.indexOf('E-MTAB') === 0 || study.indexOf('E-GEOD') === 0) {
	    studies[study] = true
	}
    }
})

// TODO https://www.ebi.ac.uk/arrayexpress/files/E-MTAB-1335/E-MTAB-1335.idf.txt one line for experiment info
studies = _.keys(studies)
console.log(_.size(studies) + ' studies (E-GEOD or E-MTAB) in ' + infile)

//// STUDY DESCRIPTIONS

var studyDescs = {}

// don't redownload studies that have been run before
// TODO JSONStream
if (fs.existsSync(outfileStudies)) {
    studyDescs = JSON.parse(fs.readFileSync(outfileStudies, 'utf8'))
    console.log(_.size(studyDescs) + ' studies already downloaded')
    studies = _.difference(studies, _.keys(studyDescs))
    console.log(_.size(studies) + ' studies to download now')
}

async.eachSeries(studies, function(study, callback) {
    var idfFile = 'https://www.ebi.ac.uk/arrayexpress/files/' + study + '/' + study + '.idf.txt'
    request(idfFile, function(err, resp, body) {
	if (!err && resp.statusCode === 200) {
	    lines = body.split('\n')
	    var studyDesc = {}
	    _.forEach(lines, function(line) {
		var split = line.split('\t')
		if (split.length > 1) {
		    studyDesc[split[0].trim().replace(' [', '[').replace('] ', ']')] = split.slice(1).join('\t')
		}
	    })
	    studyDescs[study] = studyDesc
	    callback()
	} else {
	    callback(err)
	}
    })
}, function(err) {
    if (err) {
	return console.log(err)
    } else {
	fs.writeFileSync(outfileStudies, JSON.stringify(studyDescs, null, 4), 'utf8')
	console.log(_.size(studyDescs) + ' studies with ArrayExpress data')
	console.log('ArrayExpress study data written to ' + outfileStudies)
    }
})

//// RUN DESCRIPTIONS

var runs = {}
var notFound = {}

// don't redownload runs that have been run before
// TODO JSONStream
if (fs.existsSync(outfileRuns)) {
    runs = JSON.parse(fs.readFileSync(outfileRuns, 'utf8'))
    console.log(_.size(runs) + ' runs already downloaded')
}

async.eachSeries(studies, function(study, callback) {
    var sdrfFile = 'https://www.ebi.ac.uk/arrayexpress/files/' + study + '/' + study + '.sdrf.txt'
    fetchRunData(sdrfFile, function(err) {
	if (err) {
	    fetchRunData(sdrfFile.replace('.sdrf.txt', '.seq.sdrf.txt'), function(err) {
		if (err) {
		    notFound[study] = true
		}
		callback()
	    })
	} else {
	    callback()
	}
    })
}, function(err) {
    if (err) {
	return console.log(err)
    } else {
	fs.writeFileSync(outfileRuns, JSON.stringify(runs, null, 4), 'utf8')
	console.log(_.size(runs) + ' runs with ArrayExpress data')
	console.log(_.size(notFound) + ' studies not found as .sdrf.txt or .seq.sdrf.txt')
	console.log('ArrayExpress run data written to ' + outfileRuns)
    }
})

function fetchRunData(url, cb) {
    request(url, function(err, resp, body) {
	if (!err && resp.statusCode === 200) {
	    lines = body.split('\n')
	    var headers = lines[0].split('\t')
	    headers = _.map(headers, function(header) {
		return header.trim().replace(/"/g, '').replace(' [', '[').replace('] ', ']').toUpperCase()
	    })
	    var runCol = headers.indexOf('COMMENT[ENA_RUN]')
	    if (runCol < 0) {
		runCol = headers.indexOf('ASSAY NAME')
		if (runCol < 0) {
		    console.log('runCol not found: ' + url)
		    return cb()
		}
	    }
	    // console.log(study + ': ' + (lines.length - 1) + ' runs')
	    _.forEach(lines.slice(1), function(line) { // each run
		var split = line.split('\t')
		if (split.length > 1) {
		    var run = {}
		    for (var i = 0; i < split.length; i++) {
			run[headers[i]] = split[i]
		    }
		    var runId = split[runCol]
		    if (!runs[runId]) {
			runs[runId] = run
		    }
		}
	    })
	    cb()
	} else {
	    cb({name: 'IOError', message: 'couldn\'t get ' + url})
	}
    })
}
