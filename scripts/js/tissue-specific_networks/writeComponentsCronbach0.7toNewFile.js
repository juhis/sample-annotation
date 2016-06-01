/*
 * Author: Pytrik Folkertsma
 * Purpose: test 
 */

var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var gunzip = require('zlib').createGunzip()
var stream = through(write, end)
var genstats = require('genstats')
var start = new Date().getTime()

if (process.argv.length != 5){
	console.log('This script writes the eigenvectors with cronbach alpha > 0.7 to a new file.')
	console.log('>> Eigenvectorfile needs to have PCs on the rows and genes on the columns!')
	console.log('Usage: node writeComponentsCronbach0.7toNewFile.js eigenvectorfile cronbachalphas output')
	process.exit(1)
}

var input = fs.createReadStream(process.argv[2])
var cronbach = fs.readFileSync(process.argv[3]).toString().split('\n')
var output = fs.createWriteStream(process.argv[4])

input.pipe(split()).pipe(stream).pipe(output)

var count = 0

function write(buffer, encoding, next){
	if (count == 0){
		this.push(buffer.toString() + '\n')
		count ++
		next()
	} else {
		if (parseFloat(cronbach[count]) > 0.7) {
			this.push(buffer.toString() + '\n')
			count ++
			next()
		} else {
			count ++
			next()
		}
	}
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
