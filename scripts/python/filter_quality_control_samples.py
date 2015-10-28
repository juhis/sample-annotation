#-----------------------------------------------------------------------------------------------------------------------
# Name:         filter_quality_control_samples.py
# Purpose:      This script writes the samples that passed quality control to a new file.
# Author:       Pytrik Folkertsma
# Created:      07-10-2015
#-----------------------------------------------------------------------------------------------------------------------

import sys

def main():
    if (len(sys.argv) != 4):
        print('\nThis script writes the samples that passed quality control to a new file.\n')
        print('Usage: python filter_quality_control_samples.py sample_annotations.txt run_accessions_of_passed_samples output.txt')
        sys.exit(0)

    dict = {}
    passedSamples = open(sys.argv[2], 'r', encoding="utf8")
    allSamples = open(sys.argv[1], 'r', encoding="utf8")
    newFile = open(sys.argv[3], 'w', encoding="utf8")
    newFile.write(allSamples.readline())

    for line in allSamples:
        run_accession = line.split('\t')[0].strip()
        dict[run_accession] = line

    for sample in passedSamples:
        newFile.write(dict[sample.strip()])

    newFile.close()

if __name__ == '__main__':
    main()
