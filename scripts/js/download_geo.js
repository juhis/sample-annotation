var _ = require('lodash')
var request = require('request')
var async = require('async')
var fs = require('fs')

var infile = '../../data/2015_09_24_ENA.txt'
var outfile = '../../data/GSMAnnotation.txt'
var columnsToWrite = ['source_name_ch1', 'characteristics_ch1', 'description', 'treatment_protocol_ch1', 'extract_protocol_ch1', 'contact_name', 'contact_institute', 'contact_city', 'contact_state', 'contact_country']

var lines = fs.readFileSync(infile, 'utf8').split(/\r?\n|\r/)
var studyCol = lines[0].split('\t').indexOf('study_alias')
if (studyCol < 0) {
    console.err('no study_alias column found!')
    process.exit(1)
}
var centerCol = lines[0].split('\t').indexOf('center_name')
if (centerCol < 0) {
    console.err('no center_name column found!')
    process.exit(1)
}

var numGEOSamples = 0
var studies = {}
var nonGSEStudies = {}
_.forEach(lines.slice(1), function(line) {
    var split = line.split('\t')
    if (split.length > 1 && split[centerCol] == 'GEO') {
	var study = split[studyCol].replace('-2', '')
	if (study.indexOf('GSE') === 0) {
	    studies[study] = true
	    numGEOSamples++
	} else {
	    nonGSEStudies[study] = true
	}
    }
})

studies = _.keys(studies)
console.log(_.size(studies) + ' GEO studies to fetch, ' + numGEOSamples + ' samples')

var sampleAnnotation = {}
var out = fs.createWriteStream(outfile, 'utf8')
out.write('accession\t')
out.write(columnsToWrite.join('\t') + '\n')

if (!fs.existsSync('../../data/GSE/')) {
    fs.mkdirSync('../../data/GSE')
}

async.eachSeries(studies, function(study, callback) {

    console.log('processing ' + study)

    if (fs.existsSync('../../data/GSE/' + study + '.txt')) {
	lines = fs.readFileSync('../../data/GSE/' + study + '.txt', 'utf8').split('\n')
	fillAnnotation(lines)
	callback()
    } else {
	var url = 'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + study + '&targ=all&form=text&view=brief'
	request(url, function(err, resp, body) {
	    if (!err && resp.statusCode === 200) {
		fs.writeFileSync('../../data/GSE/' + study + '.txt', body, 'utf8')
		lines = body.split('\n')
		fillAnnotation(lines)
	    } else {
		console.log('failed to fetch ' + url)
	    }
	    callback()
	})
    }
    
}, function(err) {
    if (err) {
	return console.log(err)
    } else {
	_.forEach(sampleAnnotation, function(annotation, sample) {
	    out.write(sample)
	    _.forEach(columnsToWrite, function(col) {
		out.write('\t' + ((annotation[col] && annotation[col].replace('\t', '|')) || ''))
	    })
	    out.write('\n')
	})
	console.log(_.size(sampleAnnotation) + ' samples\' GEO annotation processed')
    }
})

function fillAnnotation(lines) {
    var curSample = null
    _.forEach(lines, function(line) {
	if (line.indexOf('^SAMPLE') === 0) {
	    curSample = line.replace('^SAMPLE = ', '').trim()
	    sampleAnnotation[curSample] = {}
	} else if (curSample && line.search('!Sample_') === 0) {
	    var s = line.split(' = ')
	    var field = s[0].replace('!Sample_', '').trim()
	    sampleAnnotation[curSample][field] = s[1].trim()
	}
    })
}
