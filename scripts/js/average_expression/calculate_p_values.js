var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var zlib = require('zlib');
var gunzip = zlib.createGunzip()
var gzip = zlib.createGzip()
var calculatePvalues = through(calculatePvalues, end);
var genstats = require('genstats')
var start = new Date().getTime();

if (process.argv.length !== 5) {
	console.log('This script calculates the P-values per tissue/cancer site/cell line compared to the rest of the samples.')
	console.log('Usage: node calculate_p_values.js indices.json input_matrix output_matrix.txt')
	process.exit(1);
}

var indicesPerTissue = require('./' + process.argv[2])
var matrix = fs.createReadStream(process.argv[3]);
var pValuesMatrix = fs.createWriteStream(process.argv[4]);

if (process.argv[3].lastIndexOf('.gz') == process.argv[3].length - 3){
	matrix.pipe(gunzip).pipe(split()).pipe(calculatePvalues).pipe(pValuesMatrix);
} else {
	matrix.pipe(split()).pipe(calculatePvalues).pipe(pValuesMatrix);
}

function calculatePvalues(buffer, encoding, next) {
	var line = buffer.toString().split('\t')
	if (_.startsWith(line[0], '-')){
		//push all keys of the JSON file to the first row of the matrix
		var header = []
		_.forEach(indicesPerTissue, function(value, key){
			header.push(key.charAt(0).toUpperCase() + key.slice(1))
		})
		this.push('-\t' + header.join('\t'))
	} else if (line.length != 1){
		var gene = line[0]
		var pValues = []
		line = _.map(line, function(expression_value) {return parseFloat(expression_value)}); //convert values to float
		_.forEach(indicesPerTissue, function(indices, tissue){ //for each tissue, create a list with the values associated with the tissue and a list with the rest of the samples
			var values = []
			var otherValues = line
			_.forEach(indices, function(index) {
				values.push(line[index])
				delete otherValues[line[index]]
			})
			pValues.push(genstats.student(values, otherValues.slice(1)).p) //perform t-test on the two groups (deleted first item of otherValues (= the gene id))
		})
		this.push('\n' + gene + '\t' + pValues.join('\t'))
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