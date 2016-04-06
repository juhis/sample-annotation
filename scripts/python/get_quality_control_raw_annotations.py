#-------------------------------------------------------------------------------
# Name:        module1
# Purpose:
#
# Author:      FolkersmaP
#
# Created:     25-01-2016
# Copyright:   (c) FolkersmaP 2016
# Licence:     <your licence>
#-------------------------------------------------------------------------------

def main():
    newFile = open('../../data/raw_annotations_after_QQ.txt', 'w')
    qqsamples = set()
    for line in open("../../data/FastPCAOverSamplesEigenvectors.200.0.7.0.9.samples.txt"):
        qqsamples.add(line.strip())

    rawAnnotations = open('../../data/Old/2015_09_24_ENA_with_SRA_ArrayExpress_GEO_filtered_columns.txt')
    newFile.write(rawAnnotations.readline())
    for line in rawAnnotations:
        line = line.split('\t')
        if line[5] in qqsamples:
            newFile.write('\t'.join(line))

if __name__ == '__main__':
    main()
