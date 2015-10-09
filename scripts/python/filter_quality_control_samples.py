#-----------------------------------------------------------------------------------------------------------------------
# Name:         filter_quality_control_samples.py
# Purpose:      This script writes the samples that passed quality control to a new file.
# Author:       Pytrik Folkertsma
# Created:      07-10-2015
#-----------------------------------------------------------------------------------------------------------------------

def main():
    dict = {}
    passedSamples = open('../../data/sample run_accessions that passed quality control.txt', 'r', encoding="utf8")
    allSamples = open('../../data/sample_annotation.txt', 'r', encoding="utf8")
    newFile = open('../../data/sample_annotation_after_quality_control.txt', 'w', encoding="utf8")
    newFile.write(allSamples.readline())

    for line in allSamples:
        run_accession = line.split('\t')[0].strip()
        dict[run_accession] = line

    for sample in passedSamples:
        newFile.write(dict[sample.strip()])

    newFile.close()

if __name__ == '__main__':
    main()
