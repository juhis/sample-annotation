#-----------------------------------------------------------------------------------------------------------------------
# Name:         group_fields_sample_annotation.py
# Purpose:      This script groups the fields of the sample annotations.
# Author:       Pytrik Folkertsma
# Created:      10-09-2015
#-----------------------------------------------------------------------------------------------------------------------

from collections import Counter
import pprint

def main():
    is_cancer = []
    is_cell_line = []
    cancer_site = []
    cell_line = []
    organism_part = []
    tissue = []

    for line in open('../../data/sample_annotation.txt').readlines()[1:]:
        line = line.split('\t')
        line = list(map(str.strip, line))
        is_cancer.append(line[1])
        is_cell_line.append(line[3])
        cancer_site.append(line[4])
        cell_line.append(line[5])
        organism_part.append(line[6])
        tissue.append(line[7])

    print('Is cancer')
    pprint.pprint(sorted(list(Counter(is_cancer).items()), key=lambda x: x[1]))
    print('\n\nIs cell line')
    pprint.pprint(sorted(list(Counter(is_cell_line).items()), key=lambda x: x[1]))
    print('\n\nCancer site')
    pprint.pprint(sorted(list(Counter(cancer_site).items()), key=lambda x: x[1]))
    print('\n\nCell line')
    pprint.pprint(sorted(list(Counter(cell_line).items()), key=lambda x: x[1]))
    print('\n\nOrganism parts')
    pprint.pprint(sorted(list(Counter(organism_part).items()), key=lambda x: x[1]))
    print('\n\nTissues')
    pprint.pprint(sorted(list(Counter(tissue).items()), key=lambda x: x[1]))

if __name__ == '__main__':
    main()
