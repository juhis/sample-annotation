/*
 * This script writes samples with an given annotated tissue from the gene expression amtrix to a new file.
 * Author: Pytrik Folkertsma
 */

var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var stream = through(calculateAverageExpression, end);
var gunzip = require('zlib').createGunzip();
var start = new Date().getTime();

if (process.argv.length !== 6) {
	console.log('This script writes samples with an given annotated tissue from the gene expression amtrix to a new file.\n')
	console.log('Usage: node get_tissue-annotated_samples.js indices.json gene-expression-matrix output.txt tissue')
	process.exit(1);
}

var indices = require('./' + process.argv[2])
var input = fs.createReadStream(process.argv[3]);
var output = fs.createWriteStream(process.argv[4]);
var tissue = process.argv[5]

if (process.argv[3].indexOf('.gz') == process.argv[3].length - 3){
	input.pipe(gunzip).pipe(split()).pipe(stream).pipe(output)
} else {
	input.pipe(split()).pipe(stream).pipe(output)
}


function calculateAverageExpression(buffer, encoding, next) {
	var line = buffer.toString().split('\t')
	if (_.startsWith(line[0], '-')){
		var header = []
		_.forEach(indices[tissue], function(sample){
			header.push(line[sample])
		})
		var d = new Date()
		this.push(d.getDate() + '-' + d.getMonth() + '-' + d.getFullYear() + '\t' + header.join('\t') + '\n')
	} else if (line.length != 1){
		var gene = line[0]
		var values = []
		_.forEach(indices[tissue], function(value){
			values.push(line[value])
		})
		this.push(gene + '\t' + values.join('\t') + '\n')
	}
	next();
}

function end() {
	var end = new Date().getTime();
	console.log(timeToString((end - start)));
}

function timeToString(milliseconds){
	var numhours = Math.floor(((milliseconds % 31536000/1000) % 86400) / 3600);
	var numminutes = Math.floor((((milliseconds % 31536000/1000) % 86400) % 3600) / 60);
	var numseconds = (((milliseconds % 31536000) % 86400/1000) % 3600) % 60;
	return numhours + " hours, " + numminutes + " minutes, " + numseconds + " seconds.";
}