/*
 * This script calculaties the average expression per tissue for every gene. 
 */

var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var stream = through(calculateAverageExpression, end);
var gunzip = require('zlib').createGunzip();
var start = new Date().getTime();


if (process.argv.length !== 5) {
	console.log('This script calculates the average expression per tissue based on the given matrix. Before you can use it you first have to run get_indices.json to get the indices of the samples per organism part/tissue.\n')
	console.log('Usage: node calculate_average_expression_per_tissue.js celltype_indices.json input_matrix.txt output_matrix.txt')
	process.exit(1);
}

var tissue_indices = require('./' + process.argv[2])
var matrix = fs.createReadStream(process.argv[3]);
var average_expression_per_tissue_matrix = fs.createWriteStream(process.argv[3]);

function calculateAverageExpression(buffer, encoding, next) {
	var line = buffer.toString().split('\t')
	if (_.startsWith(line[0], '-')){
		//push all organism_part and tissue names to the first row of the matrix
		var header = []
		_.forEach(tissue_indices, function(value, key){
			header.push(key.charAt(0).toUpperCase() + key.slice(1))
		})
		this.push('-\t' + header.join('\t'))
	} else if (line.length != 1){
		var gene = line[0]
		var tissuesAverageGeneExpression = []
		line = _.map(line, function(expression_value) {return parseFloat(expression_value)}); //convert values to float
		_.forEach(tissue_indices, function(indices, tissue){ //for each tissue, take the values of the corresponding indices and divide by the number of indices.
			tissuesAverageGeneExpression.push(_.reduce(indices, function(total, n){
				return total + line[n]
			}, 0) / indices.length)
		})
		this.push('\n' + gene + '\t' + tissuesAverageGeneExpression.join('\t'))
	}
	next();
}

function end() {
	var end = new Date().getTime();
	console.log(timeToString((end - start)));
}


if (process.argv[3].indexOf('.gz') == process.argv[3].length - 3){
	matrix.pipe(gunzip).pipe(split()).pipe(stream).pipe(average_expression_per_tissue_matrix)
} else {
	matrix.pipe(split()).pipe(stream).pipe(average_expression_per_tissue_matrix)
}


function timeToString(milliseconds){
	var numhours = Math.floor(((milliseconds % 31536000/1000) % 86400) / 3600);
	var numminutes = Math.floor((((milliseconds % 31536000/1000) % 86400) % 3600) / 60);
	var numseconds = (((milliseconds % 31536000) % 86400/1000) % 3600) % 60;
	return numhours + " hours, " + numminutes + " minutes, " + numseconds + " seconds.";
}