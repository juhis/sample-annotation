/*
 * This script calculates the average expression per tissue for every gene. 
 */

var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var stream = through(getTissueSpecificSamples, end);
var gunzip = require('zlib').createGunzip();
var start = new Date().getTime();

if (process.argv.length !== 5) {
	console.log('This script writes the tissue annotated samples of the expression matrix to a new matrix.\n')
	console.log('Usage: node get_tissue-specific_samples.js indices.json input output.txt')
	process.exit(1);
}

var indices = require('./' + process.argv[2])
var matrix = fs.createReadStream(process.argv[3]);
var output = fs.createWriteStream(process.argv[4]);



if (process.argv[3].indexOf('.gz') == process.argv[3].length - 3){
	matrix.pipe(gunzip).pipe(split()).pipe(stream).pipe(output)
} else {
	matrix.pipe(split()).pipe(stream).pipe(output)
}


function getTissueSpecificSamples(buffer, encoding, next) {
	var line = buffer.toString().split('\t')
	if (_.startsWith(line[0], '-')){
		//push all keys of the JSON file to the first row of the matrix
		
		var header = []
		_.forEach(indices, function(index){
			header.push(line[index])
		})
		this.push('-\t' + header.join('\t'))
	} else if (line.length != 1){
		var gene = line[0]
		var values = []
		line = _.map(line, function(expression_value) {return parseFloat(expression_value)}); //convert values to float
		_.forEach(indices, function(value){
			values.push(line[value])
		})
		this.push('\n' + gene + '\t' + values.join('\t'))
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