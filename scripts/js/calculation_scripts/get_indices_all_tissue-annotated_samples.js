/*
 * This script creates three JSON files: celltype_indices.json, cancer_site_indices.json and cell_line_indices.json.
 * They contain the indices of the run accessions in the header of the matrix per tissue/cancer site/cell line.
 */

var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var streamAnnotations = through(getRunAccessionsSamples, end);

if (process.argv.length !== 4) {
	console.log('This script writes the indices of the tissue-annotated samples in the epxression matrix to a JSON.\n')
	console.log('Usage: node get_indices_all_tissue-annotated_samples.js sample_annotation_after_quality_control.txt output.json')
	process.exit(1);
}

var sample_annotation = fs.createReadStream(process.argv[2])
var indicesCelltypes = {}
var indicesCancersite = {}
var indicesCellLines = {}

var header = ['']

var runAccessions = []

fs.readFile(process.argv[2], function(err, data){
	if (err){
		console.log(err)
	} else{
		_.forEach(data.toString().split('\n'), function(line) {
			run_accession = line.split('\t')[0] 
			if (run_accession.length != 0 && run_accession != 'run_accession') {
				header.push(run_accession)
			} 
		})
	}
})

function getRunAccessionsSamples (buffer, encoding, next) {
	var line = buffer.toString().split('\t')
	if (!(_.startsWith(line[0], 'run_accession') || line.length == 1)) {
		if (line[3] == 'no' && line[1] == 'no') { //exclude cell line and cancer samples
			if (line[6] != ''){ //line[6] = organism part
				runAccessions.push(line[0])
			} 
		}
	}
	next();
}

function end () {
	console.log(header.length-1)
	var i = []
	_.forEach(runAccessions, function(runAccession){
		i.push(header.indexOf(runAccession))
	})

	var output = fs.createWriteStream(process.argv[3]);
	output.write(JSON.stringify(i, null, '\t'))
}

sample_annotation.pipe(split()).pipe(streamAnnotations)
