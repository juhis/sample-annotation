/*
 * Author: Pytrik Folkertsma
 * Purpose: this script calculates the average expression, standard deviation, Z score and AUC per tissue for every gene. 
 */

var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var gunzip = require('zlib').createGunzip()
var stream = through(calculateStatistics, end)
var genstats = require('genstats')
var start = new Date().getTime()

if (process.argv.length !== 6 || (!(process.argv[5] == "avg" || process.argv[5] == "stdev" || process.argv[5] == "z" || process.argv[5] == 'auc'))) {
	console.log('This script calculates the average expression, standard deviation, Z score or AUC per tissue.\n')
	console.log('Usage: node calculate_statistics.js indices input output.txt avg/stdev/z/auc')
	process.exit(1);
}

var indices = require('./' + process.argv[2])
var input = fs.createReadStream(process.argv[3])
var output = fs.createWriteStream(process.argv[4])
var calculation = process.argv[5]


if (process.argv[3].indexOf('.gz') == process.argv[3].length - 3){
	input.pipe(gunzip).pipe(split()).pipe(stream).pipe(output)
} else {
	input.pipe(split()).pipe(stream).pipe(output)
}

count = 0

function calculateStatistics(buffer, encoding, next){
	var line = buffer.toString().split('\t')
	if (count < 1){
		//push all keys (tissues) of the JSON indices file to the first row of the matrix
		var header = []
		_.forEach(indices, function(value, key){
			header.push(key.charAt(0).toUpperCase() + key.slice(1))
		})
		this.push('-\t' + header.join('\t'))
		count ++
	} else if (line.length != 1){
		if (calculation.toLowerCase() == 'avg'){
			this.push(calculateAverageExpression(line))
		} else if (calculation.toLowerCase() == 'stdev'){
			this.push(calculateStdevs(line))
		} else if (calculation.toLowerCase() == 'z'){
			this.push(calculateZscores(line))
		} else 	if (calculation.toLowerCase() == 'auc'){
			this.push(calculateAuc(line))
		}
	}
	next()
}

function calculateAverageExpression(line) {
	var gene = line[0]
	var avgValues = []
	line = _.map(line, function(expression_value) {return parseFloat(expression_value)}); //convert values to float
	_.forEach(indices, function(indices, tissue){ //for each tissue, take the values of the corresponding indices and divide by the number of indices.
		avgValues.push(_.reduce(indices, function(total, n){
			return total + line[n]
		}, 0) / indices.length)
	})
	return '\n' + gene + '\t' + avgValues.join('\t')
}

function calculateStdevs(line){
	var gene = line[0]
	var stdevs = []
	line = _.map(line, function(expression_value) {return parseFloat(expression_value)}); //convert values to float
	_.forEach(indices, function(indices, tissue){ 
		var values = _.map(indices, function(index){
			return line[index]
		})
		stdevs.push(genstats.stdev(values))
	})
	return '\n' + gene + '\t' + stdevs.join('\t')
}

function calculateZscores(line){
	var gene = line[0]
	var zScores = []
	line = _.map(line, function(expression_value) {return parseFloat(expression_value)}) //convert values to float
	_.forEach(indices, function(indices, tissue){ //for each tissue, create a list with the values associated with the tissue and a list with the rest of the samples
		var values = []
		var otherValues = line
		_.forEach(indices, function(index) {
			values.push(line[index])
			delete otherValues[line[index]]
		})
		var pValue = genstats.wilcoxon(values, otherValues.slice(1)).p  //perform t-test on the two groups (deleted first item of otherValues (= the gene id))
		var zScore = genstats.probability.pToZ(pValue)
		zScores.push(zScore) 
	})
	return '\n' + gene + '\t' + zScores.join('\t')
}

function calculateAuc(line) {
	var gene = line[0]
	var aucValues = []
	line = _.map(line, function(expression_value) {return parseFloat(expression_value)}) //convert values to float
	_.forEach(indices, function(indices, tissue){ //for each tissue, create a list with the values associated with the tissue and a list with the rest of the samples
		var values = []
		var otherValues = line
		_.forEach(indices, function(index) {
			values.push(line[index])
			delete otherValues[line[index]]
		})
		aucValues.push(genstats.wilcoxon(values, otherValues.slice(1)).auc) //perform wilcoxon test on the two groups (deleted first item of otherValues (= the gene id))
	})
	return '\n' + gene + '\t' + aucValues.join('\t')
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