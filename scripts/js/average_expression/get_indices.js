/*
 * This script creates three JSON files: celltype_indices.json, cancer_site_indices.json and cell_line_indices.json.
 * They contain the indices of the run accessions in the header of the matrix per tissue/cancer site/cell line.
 */

var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var split = require('split');
var streamAnnotations = through(makeDictionary, end);

if (process.argv.length !== 4) {
	console.log('This script creates three JSON files: celltype_indices.json, cancer_site_indices.json and cell_line_indices.json. They contain the indices of the run accessions in the header of the matrix per tissue/cancer site/cell line.\n')
	console.log('Usage: node get_indices.js sample_annotation_after_quality_control.txt outputDir')
	process.exit(1);
}

var sample_annotation = fs.createReadStream(process.argv[2]);
var indicesCelltypes = {};
var indicesCancersite = {};
var indicesCellLines = {};

var header = [''];
var runAccessionsCelltypes = {};
var runAccessionsCancersites = {};
var runAccessionsCellLines = {};

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

function makeDictionary (buffer, encoding, next) {
	var line = buffer.toString().split('\t')
	if (!(_.startsWith(line[0], 'run_accession') || line.length == 1)) {
		getNormalSamples(line)
		getCancerSamples(line)
		getCellLineSamples(line)
	}
	next();
}

function getNormalSamples(line){
	//check for organism part and tissues, exclude cell line and cancer samples
	if (line[3] == 'no' && line[1] == 'no') { //exclude cell line and cancer samples
		if (line[6] != '') { //line[6] = organism_part
			if (!(line[6] in runAccessionsCelltypes)) {runAccessionsCelltypes[line[6]] = Array()}
			runAccessionsCelltypes[line[6]].push(line[0]) //push run_accession to runAccessionsCelltypes

			if (line[7] != '') { //line[7] = tissues
				if (!(line[7] in runAccessionsCelltypes)) {runAccessionsCelltypes[line[7]] = Array()}
				runAccessionsCelltypes[line[7]].push(line[0]) //push run_accession to dict
			}
		}
	}
}

function getCancerSamples(line){
	//check for cancer sites, exclude cell line samples
	if (line[1] == 'yes' && line[3] == 'no'){
		if (line[4] != '') {
			if (!(line[4] in runAccessionsCancersites)) {runAccessionsCancersites[line[4]] = Array()}
			runAccessionsCancersites[line[4]].push(line[0]);
		}
	}
}

function getCellLineSamples(line){
	//check for cell line
	if (line[3] == 'yes'){ //line[3] = is_cell_line
		if (line[5] != ''){ //line[5] = cell_line
			if (!(line[5] in runAccessionsCellLines)) {runAccessionsCellLines[line[5]] = Array()}
			runAccessionsCellLines[line[5]].push(line[0]) //push run_accession to dict
		}
	}
}


function end () {
	console.log(header.length)

	//write celltype indices to JSON
	_.forEach(runAccessionsCelltypes, function(run_accessions, item){
		var i = []
		_.forEach(run_accessions, function(run_accession){ i.push(header.indexOf(run_accession))})
		indicesCelltypes[item] = i
	})

	_.forEach(runAccessionsCancersites, function(run_accessions, item){
		var i = []
		_.forEach(run_accessions, function(run_accession){i.push(header.indexOf(run_accession))})
		indicesCancersite[item] = i
	})

	_.forEach(runAccessionsCellLines, function(run_accessions, item){
		var i = []
		_.forEach(run_accessions, function(run_accession){i.push(header.indexOf(run_accession))})
		indicesCellLines[item] = i
	})

	var outputCelltypes = fs.createWriteStream(process.argv[3] + '/celltype_indices.json');
	var outputCancersites = fs.createWriteStream(process.argv[3] + '/cancer_site_indices.json');
	var outputCellLines = fs.createWriteStream(process.argv[3] + '/cell_line_indices.json');
	
	outputCelltypes.write(JSON.stringify(indicesCelltypes, null, '\t'))
	outputCancersites.write(JSON.stringify(indicesCancersite, null, '\t'))
	outputCellLines.write(JSON.stringify(indicesCellLines, null, '\t'))
}

sample_annotation.pipe(split()).pipe(streamAnnotations)
