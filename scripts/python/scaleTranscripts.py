#
# This program scales the average per tissue per transcript to values that can be used for transcript bars in Gene Network.
# Author: Pytrik Folkertsma
#

import sys
import collections

def main():
    matrix = open(sys.argv[1], 'r')
    newFile = open(sys.argv[3], 'w')
    transcriptValues = {}
    genesToTranscripts = collections.OrderedDict()
    newFile.write(matrix.readline())

    for line in matrix:
        name = line.split('\t')[0].strip()
        transcriptValues[name] = line.strip().split('\t')[1::]

    for line in open(sys.argv[2]):
        line = line.strip().split('\t')
        if (line[0] not in genesToTranscripts):
            genesToTranscripts[line[0]] = [line[1]]
        else:
            genesToTranscripts[line[0]].append(line[1])

    for item in genesToTranscripts:
        maximal = 0
        minimal = 0
        for transcript in genesToTranscripts[item]:
            if transcript in transcriptValues:
                for value in transcriptValues[transcript]:
                    try:
                        value = float(value)
                        if value > maximal:
                            maximal = value
                        if value < minimal:
                            minimal = value
                    except:
                        pass

        for transcript in genesToTranscripts[item]:
            if transcript in transcriptValues:
                try:
                    transcriptValues[transcript] = list(map((lambda x: str(round((float(x) + abs(float(minimal))) / (abs(minimal) + maximal), 2))), transcriptValues[transcript]))
                except:
                    transcriptValues[transcript] = list(map(lambda x: str(0), transcriptValues[transcript]))

    for gene in genesToTranscripts:
        for transcript in genesToTranscripts[gene]:
            if transcript in transcriptValues:
                newFile.write(gene + '|' + transcript + '\t' + '\t'.join(transcriptValues[transcript]) + '\n')

    newFile.close()

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('This program scales the average per tissue per transcript to values that can be used for transcript bars in Gene Network.')
        print('Usage: python scaleTranscripts.py input.txt geneIDsToTranscriptIDs.txt output.txt')
    else:
        main()