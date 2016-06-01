/*
 * This script writes the transcript bar values in a matrix to a leveldb database.
 * Author: Pytrik Folkertsma
 */

var level = require('level');
var db = level('transcriptbars', {valueEncoding: 'binary'});
var fs = require('fs');
var through = require('through2');
var stream = through(writeCellTypesToDb);
var split = require('split');
var _ = require('lodash');

if (process.argv.length != 3) {
	console.log('This script writes matrix values for the transcript bars to the database.')
	console.log('Usage: node writeTranscriptsToDb.js matrix.txt')
	process.exit(1)
}

var matrix = fs.createReadStream(process.argv[2])
var celltypes = require('./number_of_samples_per_tissue.json')

//make array with all tissues and celltypes
var celltypesList = Array()
 _.forEach(celltypes, function(item){
	celltypesList.push(item["name"])
})

var indices = {}

function writeCellTypesToDb(buffer, encoding, next){
	var line = buffer.toString().split('\t')
	if (_.startsWith(line[0], '-')){
		//push the right indices of the tissues/celltypes in the matrix row to the indices object.
		_.forEach(line, function(i){
			indices[i] = line.indexOf(i);
		})
		console.log(celltypesList)
		db.put('!RNASEQ!TISSUES', JSON.stringify(celltypesList), [{valueEncoding: 'json'}], function(err){
			if (err) return console.log(err)
		})
	} else {
		var array = _.map(celltypesList, function(celltype) {return line[indices[celltype]]}) // put the values of the matrix in the right order in array
		var buffer = new Buffer(array.length * 2)
		for (var i = 0; i < array.length; i++) {
			buffer.writeUInt16BE(Math.round(array[i] * 1000 + 32768), i * 2)
		}
		db.put('RNASEQ!' + line[0].split('|')[0] + '!TRANSCRIPTBARS!' + line[0].split('|')[1], buffer, function(err){
			if (err) console.log(err)
		})
	}
	next();
}

matrix.pipe(split()).pipe(stream)