var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var zlib = require('zlib');
var gunzip = zlib.createGunzip()
var gzip = zlib.createGzip()
var calculatePvalues = through(calculatePvalues, end);
var genstats = require('../../../../genstats')
var start = new Date().getTime();

if (process.argv.length !== 5) {
	console.log('This script calculates the standard deviations per tissue/cancer site/cell line.')
	console.log('Usage: node calculate_p_values.js indices.json input_matrix output_matrix.txt')
	process.exit(1);
}

var indicesPerTissue = require('./' + process.argv[2])
var matrix = fs.createReadStream(process.argv[3]);
var stdevsMatrix = fs.createWriteStream(process.argv[4]);

if (process.argv[3].lastIndexOf('.gz') == process.argv[3].length - 3){
	matrix.pipe(gunzip).pipe(split()).pipe(calculatePvalues).pipe(stdevsMatrix);
} else {
	matrix.pipe(split()).pipe(calculatePvalues).pipe(stdevsMatrix);
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
		var stdevs = []
		line = _.map(line, function(expression_value) {return parseFloat(expression_value)}); //convert values to float
		console.log(line.length)
		_.forEach(indicesPerTissue, function(indices, tissue){ 
			var values = _.map(indices, function(index){
				return line[index]
			})
			stdevs.push(genstats.stdev(values))
		})
		this.push('\n' + gene + '\t' + stdevs.join('\t'))
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