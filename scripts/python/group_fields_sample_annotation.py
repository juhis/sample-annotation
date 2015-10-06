#-------------------------------------------------------------------------------
# Name:        module1
# Purpose:
#
# Author:      FolkersmaP
#
# Created:     10-09-2015
# Copyright:   (c) FolkersmaP 2015
# Licence:     <your licence>
#-------------------------------------------------------------------------------

from collections import Counter
import pprint

def main():
    is_cancer = []
    is_cell_line = []
    cancer_site = []
    cell_line = []
    organism_part = []
    tissue = []

    for line in open('sample_annotation.txt').readlines()[1:]:
        line = line.split('\t')
        line = list(map(str.strip, line))
        is_cancer.append(line[1])
        is_cell_line.append(line[3])
        cancer_site.append(line[4])
        cell_line.append(line[5])
        organism_part.append(line[6])
        tissue.append(line[7])

    print('Is Cancer')
    pprint.pprint(sorted(Counter(is_cancer).items()))
    print('\n\nIs cell line')
    pprint.pprint(sorted(Counter(is_cell_line).items()))
    print('\n\nCancer site')
    pprint.pprint(sorted(Counter(cancer_site).items()))
    print('\n\nCell line')
    pprint.pprint(sorted(Counter(cell_line).items()))
    print('\n\nOrganism parts')
    pprint.pprint(sorted(Counter(organism_part).items()))
    print('\n\nTissues')
    pprint.pprint(sorted(Counter(tissue).items()))

if __name__ == '__main__':
    main()
