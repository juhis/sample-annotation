var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var zlib = require('zlib');
var gunzip = zlib.createGunzip()
var gzip = zlib.createGzip()
var calculateStandardScores = through(calculateStandardScores, end);
var start = new Date().getTime();

if (process.argv.length !== 4) {
	console.log('This script converts the values of a matrix to standard scores.')
	console.log('Usage: node calculate_standard_scores.js input_matrix output_matrix.txt')
	process.exit(1);
}

var matrix = fs.createReadStream(process.argv[2]);
var standardized_scores_matrix = fs.createWriteStream(process.argv[3]);

function calculateStandardScores(buffer, encoding, next) {
	var line = buffer.toString().split('\t')
	if (_.startsWith(line[0], '-')){
		this.push(line.join('\t'))
	} else if (line.length != 1){
		var gene = line[0];
		line = _.map(line.slice(1), function(expression_value) {return parseFloat(expression_value)}) // parse values to float
		var mean = _.reduce(line, function(total, value) {return total + value}) / line.length // calculate the mean 
		var sd = Math.sqrt(_.chain(line) // calculate the standard deviation by taking the square root of the result:
			.map(function(value) {return Math.pow(value - mean, 2)}) // square the difference between the value and the mean
			.reduce(function(total, value) {return total + value}) / line.length) // take the average of the result and divide by the number of samples
		var standard_scores = _.map(line, function(value) {return (value - mean) / sd}) // calculate the standard scores by subtracting the mean from the value and dividing by the sd for each value in the row
		this.push('\n' + gene + '\t' + standard_scores.join('\t'))
	}
	next()
}

function end() {
	var end = new Date().getTime();
	console.log(timeToString((end - start)));
}


if (process.argv[2].lastIndexOf('.gz') == process.argv[2].length - 3){
	matrix.pipe(gunzip).pipe(split()).pipe(calculateStandardScores).pipe(standardized_scores_matrix);
} else {
	matrix.pipe(split()).pipe(calculateStandardScores).pipe(standardized_scores_matrix);
}


function timeToString(milliseconds){
	var numhours = Math.floor(((milliseconds % 31536000/1000) % 86400) / 3600);
	var numminutes = Math.floor((((milliseconds % 31536000/1000) % 86400) % 3600) / 60);
	var numseconds = (((milliseconds % 31536000) % 86400/1000) % 3600) % 60;
	return numhours + " hours, " + numminutes + " minutes, " + numseconds + " seconds.";
}