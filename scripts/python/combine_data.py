#-------------------------------------------------------------------------------
# Name:        module1
# Purpose:
#
# Author:      FolkersmaP
#
# Created:     05-10-2015
# Copyright:   (c) FolkersmaP 2015
# Licence:     <your licence>
#-------------------------------------------------------------------------------


def combineData(firstLine, gsmAnnotations):
    '''
    Combine 2015_09_24_ENA.txt with GSMAnnotation.txt.
    '''
    newFile = open('2015_09_24_ENA_with_GEO_filtered_columns.txt', 'w')
    oldFile = open('2015_09_24_ENA.txt', 'r')
    newFile.write(oldFile.readline().strip())
    newFile.write('\t' + '\t'.join(firstLine[1::]) + '\n')
    for line in oldFile:
        line = line.replace('\n', '').split('\t')
        run_alias = line[25].split('_')[0]
        try:
            newFile.write('\t'.join(line) + '\t' + '\t'.join(gsmAnnotations[run_alias]) + '\n')
        except:
            newFile.write('\t'.join(line) + ('\t' * 10) + '\n')
    newFile.close()

def combineAllData(firstLine, gsmAnnotations):
    '''
    Combine 2015_09_24_ENA_with_SRA_ArrayExpress_filtered_columns.txt with GSMAnnotation.txt
    '''
    count = 0
    newFile = open('2015_09_24_ENA_with_SRA_ArrayExpress_GEO_filtered_columns.txt', 'w')
    oldFile = open('2015_09_24_ENA_with_SRA_ArrayExpress_filtered_columns.txt', 'r')
    newFile.write(oldFile.readline().strip())
    newFile.write('\tGEO_' + '\tGEO_'.join(firstLine[1::]).upper() + '\n')
    for line in oldFile:
        line = line.replace('\n', '').split('\t')
        run_alias = line[21].split('_')[0]
        try:
            newFile.write('\t'.join(line) + '\t' + '\t'.join(gsmAnnotations[run_alias]) + '\n')
        except:
            newFile.write('\t'.join(line) + ('\t' * 10) + '\n')
    newFile.close()


def main():
    gsmAnnotations = dict()
    data = open('GSMAnnotation.txt', 'r', encoding="utf8")
    firstLine = data.readline().replace('\n', '').split('\t')
    for line in data:
        line = line.strip().split('\t')
        gsmAnnotations[line[0]] = line[1::]
    combineData(firstLine, gsmAnnotations) #Combine 2015_09_24_ENA.txt with the GSMAnnotation.
    combineAllData(firstLine, gsmAnnotations) #Combine 2015_09_24_ENA_with_SRA_ArrayExpress_filtered_columns with the GSMAnnotation.

if __name__ == '__main__':
    main()
