d = {}


for line in open('../../data/GeneIDs_to_TranscriptIDs.txt'):
	line = line.strip().split('\t')
	if line[0] not in d:
		d[line[0]] = []
	d[line[0]].append(line[1])

for item in d:
	if len(d[item]) > 160:
		print(item)