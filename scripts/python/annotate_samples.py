#-----------------------------------------------------------------------------------------------------------------------
# Name:        annotate_samples.py
# Purpose:     This script annotates the samples in 2015_09_24_ENA_with_SRA_ArrayExpress_GEO_filtered_columns.
# Author:      Pytrik Folkertsma
# Created:     04-09-2015
#-----------------------------------------------------------------------------------------------------------------------

import sys
import re
import pprint
import operator
from collections import Counter
from datetime import datetime
startTime = datetime.now()

class Sample():
    def __init__(self, run_accession):
        self.run_accession = run_accession
        self.is_cancer = None
        self.is_metastasis = None
        self.is_cell_line = None
        self.cancer_site = None
        self.cell_line = None
        self.organism_part = None
        self.tissue = None
        self.var = ''

    def __str__(self):
        '''
        This method returns the class variables in a string.
        '''
        return 'run_accession: {}\nis_cancer: {}\nis_cell_line: {}\ncancer_site: {}\ncell_line: {}\norganims_part: {}\ntissue: {}\n\n'.format(self.run_accession, self.is_cancer, self.is_cell_line, self.cancer_site, self.cell_line, self.organism_part, self.tissue)

    def search_columns_for_is_cancer(self, indices, line):
        '''
        This method will search the columns for the words cancer/tumor/carcinoma.
        It ignores samples that contain non-tumor/non-cancer in a column. If a
        sample is identified as a cancer sample, the method will put self.is_cancer
        on 'yes', if not, the method will put self.is_cancer on 'no'.
        '''
        p = re.compile('cancer|tumor|carcinoma', re.IGNORECASE)
        pNonCancer = re.compile('non-cancer|non-tumor|without cancer|without tumor', re.IGNORECASE)

        #this are all columns that contain the word cancer/tumor/carcinoma
        columns = [#'study_title'
                    'ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                    #'GEO_CONTACT_INSTITUTE',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                    'GEO_CHARACTERISTICS_CH1',
                    #'experiment_title',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                    #'library_name',
                    #'center_name',
                    'GEO_SOURCE_NAME_CH1',
                    #'SRA_CenterName',
                    #'GEO_EXTRACT_PROTOCOL_CH1',
                    #'GEO_TREATMENT_PROTOCOL_CH1',
                    #'sample_alias',
                    #'experiment_alias',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_TYPE]',
                    #'run_alias',
                    'GEO_DESCRIPTION',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_STATUS]',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_CHARACTERISTICS]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                    #'study_alias',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_ORIGIN]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER_OR_NORMAL]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_STATE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_DESCRIPTION]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_GROUP]',
                    'ARRAYEXPRESS_SOURCE_NAME',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_STAGE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[THYROID_TISSUE_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER]',
                    'ARRAYEXPRESS_CHARACTERISTICS[SOURCE_TISSUE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_SUBPOPULATION]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL/TISSUE_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE_ORIGIN]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER_SUBTYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_SUBTYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_SOURCE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_HISTOLOGY]',
                    'SRA_Histological_Type']
        if line[indices["ARRAYEXPRESS_CHARACTERISTICS[CANCER_OR_NORMAL]"]] == 'cancer' or line[indices["SRA_Tumor"]] == 'yes':
            self.is_cancer = 'yes'
            return None
        for column in columns:
            if p.search(line[indices[column]]) and not pNonCancer.search(line[indices[column]]):
                self.is_cancer = 'yes'
                return None
        self.is_cancer = 'no'

    def search_columns_for_is_cell_line(self, indices, line):
        '''
        This method checks if the sample is from a cell line. If so, the method
        puts self.is_cell_line on 'yes', if not, the method puts self.is_cell_line
        on 'no'.
        '''
        if self.cell_line != '':
            self.is_cell_line = 'yes'
        else:
            p = re.compile('cell(\s?)(_?)line', re.IGNORECASE)

            #this are all columns that contain the word cell line
            columns = ['ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                        #'study_title',
                        'GEO_CHARACTERISTICS_CH1',
                        'experiment_title',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                        #'GEO_EXTRACT_PROTOCOL_CH1',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                        'GEO_SOURCE_NAME_CH1',
                        'GEO_TREATMENT_PROTOCOL_CH1',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_CHARACTERISTICS]',
                        'library_name',
                        'GEO_DESCRIPTION',
                        'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                        'study_alias',
                        'sample_alias',
                        #'experiment_alias',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_DESCRIPTION]',
                        'ARRAYEXPRESS_SOURCE_NAME',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE_SOURCE]',
                        'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_ORIGIN]',
                        'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_SUBPOPULATION]',
                        'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_HISTOLOGY]',
                        'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_STATE]',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE_SPECIFICITY]']
            for column in columns:
                if p.search(line[indices[column]]):
                    self.is_cell_line = 'yes'
                    return None
            self.is_cell_line = 'no'

    def search_columns_for_cancer_site(self, indices, line):
        '''
        This method searches for cancer sites.
        '''
        p = re.compile('neuroblastoma|breast(-?)(\s?)(cancer|tumor)|cervical (cancer|tumor)|prostate (cancer|tumor|tumour)|bladder (cancer|tumor)|colon (cancer|tumor)|colorectal (cancer|tumor)|rectal (cancer|tumor)|kidney (cancer|tumor)|leukemia|lung (cancer|tumor)|melanoma|pancreatic (cancer|tumor)|thyroid (cancer|tumor)|patients with pc|myeloma', re.IGNORECASE)

        #this are all columns that contain one of the words described above (neuroblastoma, breast cancer, cervical cancer, etc).
        columns = ['ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                    #'study_title',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                    'GEO_CHARACTERISTICS_CH1',
                    'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                    'GEO_SOURCE_NAME_CH1',
                    #'experiment_title',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                    #'library_name',
                    #'sample_alias',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                    #'study_alias',
                    'GEO_DESCRIPTION',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_STAGE]',
                    #'GEO_EXTRACT_PROTOCOL_CH1',
                    #'GEO_TREATMENT_PROTOCOL_CH1',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_TYPE]',
                    #'experiment_alias',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_DESCRIPTION]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_ORIGIN]',
                    'ARRAYEXPRESS_CHARACTERISTICS[SOURCE_TISSUE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER_SUBTYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL/TISSUE_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_SOURCE]',
                    'ARRAYEXPRESS_COMMENT[LIBRARY_SOURCE]']
        if self.search(columns, p, indices, line):
            self.cancer_site = self.var.replace('cancer', '').replace('-', '').replace('tumor', '').replace('tumour', '').strip()
            self.is_cancer = 'yes'

        #if no cancer site is found an empty string is assigned
        if self.cancer_site is None:
            self.cancer_site = ''

    def search_columns_for_cell_line(self, indices, line):
        '''
        This method searches for specific cell line names.
        '''
        p = re.compile('RUES2|GM12878|k562|HeLa|hep(\s?)g2|h1|huvec|SK-N-SH|IMR90|A549|MCF7|HMEC|CD14+|CD20+|IMR-32|HEK293|HCT116|HEK293T|OCI-LY19|MCF(-?)7|CRL2097|CSC8|CSC6|293S|MDA-MB-231|LNCAP|293T|MCF10A|MDA-MB231|H9|HEK 293|JurKat', re.IGNORECASE)

        #this are all columns that contain one of the cell lines described above (GM12878, k562, HeLa, etc.)
        columns = ['ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                    'experiment_title',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                    'library_name',
                    'study_title',
                    'GEO_CHARACTERISTICS_CH1',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                    'GEO_TREATMENT_PROTOCOL_CH1',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                    'experiment_alias',
                    'sample_alias',
                    'GEO_EXTRACT_PROTOCOL_CH1',
                    'GEO_DESCRIPTION',
                    'run_alias',
                    'GEO_SOURCE_NAME_CH1',
                    'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE/CELL_LINE]',
                    'ARRAYEXPRESS_SOURCE_NAME',
                    'SRA_Subject_ID',
                    'study_alias',
                    'ARRAYEXPRESS_CHARACTERISTICS[BIOSOURCEPROVIDER]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE_SPECIFICITY]',
                    'ARRAYEXPRESS_TERM_SOURCE_REF']
        if self.search(columns, p, indices, line):
            self.cell_line = self.var.replace(' ', '').replace('-', '')

        #if no cell line is found an empty string is assigned
        if self.cell_line is None:
            self.cell_line = ''

    def search_columns_for_organism_part(self, indices, line):
        '''
        This method searches for the organism_part of the sample.
        '''
        p = re.compile('colon|appendix|esophagus|esophageal|spleen|adrenal|psoas|brain|liver|pancrea|blood|skin|lung|breast|intestine|bowel|bone(\s?)marrow|testis|ovary|gall\s?bladder|bladder|kidney|heart|thymus|muscle|cervix|stomach|prostate|placenta|thyroid|adipose|epithelial|epithelium', re.IGNORECASE)
        pNot = re.compile('coloni')
        #this are all columns that contain one or more of the words described above (brain, liver, pancreas, etc.)
        columns = ['ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                    #'study_title',
                    'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                    'GEO_CHARACTERISTICS_CH1',
                    'experiment_title',
                    'GEO_SOURCE_NAME_CH1',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                    #'GEO_TREATMENT_PROTOCOL_CH1',
                    'library_name',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                    'sample_alias',
                    #'GEO_EXTRACT_PROTOCOL_CH1',
                    'experiment_alias',
                    'run_alias',
                    #'center_name',
                    #'study_alias',
                    'ARRAYEXPRESS_SOURCE_NAME',
                    'GEO_DESCRIPTION',
                    'SRA_Body_Site',
                    #'SRA_CenterName',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_SOURCE]',
                    #'GEO_CONTACT_INSTITUTE',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_CHARACTERISTICS]',
                    'ARRAYEXPRESS_CHARACTERISTICS[SOURCE_TISSUE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUES]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_ORIGIN]',
                    'ARRAYEXPRESS_CHARACTERISTICS[BIOSOURCE_PROVIDER]',
                    'ARRAYEXPRESS_COMMENT[BIOSOURCE_PROVIDER]',
                    'ARRAYEXPRESS_CHARACTERISTICS[THYROID_TISSUE_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_TYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[ORGANISMPART]',
                    #'GEO_CONTACT_NAME',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_STAGE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_DESCRIPTION]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER]',
                    #'GEO_CONTACT_CITY',
                    'ARRAYEXPRESS_CHARACTERISTICS[PRIMARY_SOURCE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE/CELL]',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_SUBTYPE]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CANCER_SUBTYPE]',
                    'SRA_Histological_Type']

        if self.search(columns, pNot, indices, line):
            self.organism_part = ''
            return

        if self.search(columns, p, indices, line):
            self.organism_part = self.var

        #if no organism_part is found an empty string is assigned
        if self.organism_part is None:
            self.organism_part = ''

    def search_columns_for_tissue(self, indices, line):
        '''
        This method searches the columns for the tissue.
        '''
        #search for brain tissues
        pBrain = re.compile('occipital|(pre)?frontal(\scortex|\slobe)?|cerebellum|cerebral cortex|parietal(\slobe)?|temporal(\slobe|\scortex|\sgyrus)?|frontal gyrus|hippocampus|caudate|putamen|(fore|mid)brain|anterior cingulate', re.IGNORECASE)
        #this are all columns that contain one or more words (brain tissues) described above
        columnsBrain = ['ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                        #'study_title',
                        'experiment_title',
                        'SRA_Body_Site',
                        'GEO_CHARACTERISTICS_CH1',
                        'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_REGION]',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                        'ARRAYEXPRESS_COMMENT[LIBRARY_SOURCE]',
                        'GEO_SOURCE_NAME_CH1',
                        'experiment_alias',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                        'ARRAYEXPRESS_CHARACTERISTICS[ORGANISMPART]',
                        'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_COMPARTMENT]',
                        'library_name',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                        'sample_alias',
                        'ARRAYEXPRESS_CHARACTERISTICS[TISSUE/CELL]',
                        'GEO_TREATMENT_PROTOCOL_CH1',
                        'study_alias']
        if self.search(columnsBrain, pBrain, indices, line):
            self.tissue = self.var
            self.organism_part = 'brain'
            return

        #search for skin cells
        pSkin = re.compile('keratinocyte|melanocyte|merkel cell|basal(\s?)epithelial(\s?)cell')
        columnsSkin = ['ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                        'study_title',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                        'GEO_DESCRIPTION',
                        'GEO_CHARACTERISTICS_CH1',
                        'experiment_title',
                        'library_name',
                        'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                        'GEO_TREATMENT_PROTOCOL_CH1',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                        'sample_alias']
        if self.search(columnsSkin, pSkin, indices, line):
            self.tissue = self.var
            self.organism_part = 'skin'
            return

        #search for blood cells
        pBlood = re.compile('cord blood|peripheral blood mononuclear|whole peripheral blood|whole blood|peripheral blood|pbmc|monocyte|t(-?)(\s?)cell|b(-?)(\s?)cell|b(-?)(\s?)lymphocyte|nk(-?)(\s?)cell|eosinophil|erythroblast|basophil|leukocyte|erythrocyte|plasma cell|myeloblast|white blood|granulocyte|platelet|neutrophil', re.IGNORECASE)
        pNoBlood = re.compile('[a-zA-Z0-9](-?)(t|b)(-?)(\s?)(_?)cell|proerythroblasts|b(-?)(\s?)(_?)cell(-?)(\s?)(_?)lymphoma', re.IGNORECASE)
        #this are all columns that contain one or more words (blood tissues) described above
        columnsBlood = [#'study_title',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                        'GEO_SOURCE_NAME_CH1',
                        'GEO_CHARACTERISTICS_CH1',
                        'GEO_TREATMENT_PROTOCOL_CH1',
                        'experiment_title',
                        #'GEO_EXTRACT_PROTOCOL_CH1',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                        'library_name',
                        'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                        'experiment_alias',
                        'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                        'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_ORIGIN]',
                        'sample_alias',
                        'run_alias',
                        'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_TYPE]',
                        'GEO_DESCRIPTION',
                        'ARRAYEXPRESS_SOURCE_NAME',
                        'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                        #'GEO_CONTACT_INSTITUTE',
                        'ARRAYEXPRESS_COMMENT[BIOSOURCE_PROVIDER]',
                        'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_SUBTYPE]']
        if self.search(columnsBlood, pNoBlood, indices, line):
            self.tissue = ''
            return

        if self.search(columnsBlood, pBlood, indices, line):
            self.tissue = self.var
            self.organism_part = 'blood'
            return

        #if no tissue is found an empty string is assigned
        if self.tissue is None:
            self.tissue = ''

    def search_columns_for_is_metastasis(self, indices, line):
        '''
        This method searches the columns for is_metastasis.
        '''
        p = re.compile('metasta|circulating (tumor|cluster of cells|single cells)', re.IGNORECASE)
        #this are all columns that contain the word metastasis, metastatic, circulating tumor cells, etc.)
        columns = [#'study_title',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_SOURCE_NAME]',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_DESCRIPTION]',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_TYPE]',
                    'GEO_CHARACTERISTICS_CH1',
                    'ARRAYEXPRESS_CHARACTERISTICS[ORGANISM_PART]',
                    #'experiment_title',
                    'ARRAYEXPRESS_COMMENT[SAMPLE_TITLE]',
                    #'library_name',
                    'ARRAYEXPRESS_CHARACTERISTICS[CELL_LINE]',
                    'GEO_SOURCE_NAME_CH1',
                    #'GEO_TREATMENT_PROTOCOL_CH1',
                    'ARRAYEXPRESS_CHARACTERISTICS[SOURCE_TISSUE]',
                    'experiment_alias',
                    'run_alias',
                    'ARRAYEXPRESS_CHARACTERISTICS[TUMOR_STAGE]',
                    'sample_alias',
                    'ARRAYEXPRESS_CHARACTERISTICS[TISSUE_HARVEST_SITE]',
                    'GEO_DESCRIPTION']
        if self.search(columns, p, indices, line):
            self.is_metastasis = 'yes'
            self.is_cancer = 'yes'
        if self.is_metastasis is None:
            self.is_metastasis = 'no'

    def has_different_cancer_site_than_organism_part(self):
        if self.is_cancer:
            if self.cancer_site != self.organism_part:
                return(self.cancer_site != '' and self.organism_part != '')

    def search(self, columns, pattern, indices, line):
        '''
        This method searches a given pattern in a given list of columns. If a
        word in one of the columns matches the pattern, the word is assigned to
        self.var and the method returns True.
        '''
        self.var = ''
        for column in columns:
            for m in pattern.finditer(line[indices[column]]):
                self.var = m.group().lower()
                return True

    def simplify_fields(self):
        '''
        Groups the same cells/tissues with different names into one.
        '''
        if self.organism_part == 'pancrea':
            self.organism_part = 'pancreas'
        if self.organism_part == 'bowel':
            self.organism_part = 'intestine'
        if self.organism_part == 'colon':
            self.organism_part = 'intestine'
        if self.organism_part == 'psoas':
            self.organism_part = 'muscle'
        if self.organism_part == 'adrenal':
            self.organism_part = 'adrenal gland'
        if self.organism_part == 'gallbladder':
            self.organism_part = 'gall bladder'
        if self.organism_part == 'esophageal':
            self.organism_part = 'esophagus'
        if self.organism_part == 'epithelial' or self.organism_part == 'epithelium':
            self.organism_part = 'epithelial tissue'
        if self.organism_part == 'adipose':
            self.organism_part = 'adipose tissue'
        if self.tissue == 't cell' or self.tissue == 'tcell' or self.tissue == 't\xa0cell' or self.tissue == 't-cell':
            self.tissue = 'T-cell'
        if self.tissue == 'b cell' or self.tissue == 'bcell' or self.tissue == 'b lymphocyte' or self.tissue == 'b-lymphocyte' or self.tissue == 'b-cell':
            self.tissue = 'B-cell'
        if self.tissue == 'nk cell' or self.tissue == 'nkcell' or self.tissue == 'nk-cell':
            self.tissue = 'NK-cell'
        if self.tissue == 'temporal cortex' or self.tissue == 'temporal':
            self.tissue = 'temporal lobe'
        if self.tissue == 'frontal':
            self.tissue = 'frontal lobe'
        if self.tissue == 'occipital':
            self.tissue = 'occipital lobe'
        if self.tissue == 'anterior cingulate':
            self.tissue = 'prefrontal cortex'
        if self.tissue == 'white blood':
            self.tissue = 'leukocyte'
        if self.tissue == 'pbmc' or self.tissue == 'peripheral blood mononuclear':
            self.tissue = 'PBMC'
        if self.tissue == 'whole peripheral blood' or self.tissue == 'peripheral blood':
            self.tissue = 'whole blood'
        if self.cancer_site == 'leukemia':
            self.cancer_site = 'blood'
        if self.cancer_site == 'melanoma':
            self.cancer_site = 'skin'
        if self.cancer_site == 'cervical':
            self.cancer_site = 'cervix'
        if self.cancer_site == 'patients with pc' or self.cancer_site == 'pancreatic':
            self.cancer_site = 'pancreas'
        if self.cancer_site == 'myeloma':
            self.cancer_site = 'bone marrow'
        if self.organism_part == 'epithelial tissue' and self.tissue == 'basal cell' or self.tissue == 'basal epithelial cell':
            self.tissue = ''


        #remove because there are not enough samples
        if self.organism_part == 'cervix' or self.organism_part == 'appendix':
            self.organism_part = ''

def main():
    '''
    This main method of the script creates a new file: sample_annotation.txt. The
    method then reads 2015_09_24_ENA_with_SRA_ArrayExpress_GEO_filtered_columns.txt
    line by line and makes a Sample object for every line. It calls the object's
    methods to determine whether the sample is a cancer sample, whether it is a
    cell line, what the cancer site is (if the sample is a cancer sample), what
    the organism part is, what the tissue is and if the sample is metastatic if it
    is a cancer sample. After that it writes the information to the new file.
    '''

    if len(sys.argv) != 3:
    	print('usage: python annotate_samples.py 2015_09_24_ENA_with_SRA_ArrayExpress_GEO_filtered_columns.txt output.txt')
    	sys.exit()

    countData = {'is_cancer': 0, 'is_metastasis': 0, 'is_cell_line': 0, 'cancer_site': 0, 'cell_line': 0, 'organism_part': 0, 'cell_type': 0}
    newFile = open(sys.argv[2], 'w') #sample_annotation.txt
    newFile.write('run_accession\tannotation_is_cancer\tannotation_is_metastasis\tannotation_is_cell_line\tannotation_cancer_site\tannotation_cell_line\tannotation_organism_part\tannotation_cell_type\tprediction_is_cancer\tprediction_is_cell_line\tprediction_cancer_site\tprediction_cell_line\tprediction_organism_part\tprediction_tissue\n')
    data = open(sys.argv[1], 'r')
    firstLine = data.readline().split('\t')
    indices = {}
    for name in firstLine:
        indices[name] = firstLine.index(name)

    for line in data:
        line = line.split('\t')

        s = Sample(line[indices["run_accession"]])
        s.search_columns_for_is_cancer(indices, line)
        s.search_columns_for_cell_line(indices, line)
        s.search_columns_for_is_cell_line(indices, line)
        s.search_columns_for_organism_part(indices, line)
        s.search_columns_for_tissue(indices, line)
        s.search_columns_for_cancer_site(indices, line)
        s.search_columns_for_is_metastasis(indices, line)
        s.simplify_fields()

        #write data to new file
        newFile.write('{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\n'.format(s.run_accession, s.is_cancer, s.is_metastasis, s.is_cell_line, s.cancer_site, s.cell_line, s.organism_part, s.tissue))

        #count filled fields
        if s.is_cancer == 'yes':
            countData['is_cancer'] += 1
        if s.is_cell_line == 'yes':
            countData['is_cell_line'] += 1
        if s.cancer_site != '':
            countData['cancer_site'] += 1
        if s.cell_line != '':
            countData['cell_line'] += 1
        if s.organism_part != '':
            countData['organism_part'] += 1
        if s.tissue != '':
            countData['cell_type'] += 1
        if s.is_metastasis == 'yes':
            countData['is_metastasis'] += 1

    newFile.close()
    pprint.pprint(countData)
    print(datetime.now() - startTime)
    #pprint.pprint(columns_by_counted_words('cancer|tumor|carcinoma'))

def columns_by_counted_words(pattern):
    '''
    This method returns how many times a given patterns is found in each column.
    '''
    dict = {}
    data = open('../../data/2015_09_24_ENA_with_SRA_ArrayExpress_GEO_filtered_columns.txt', 'r')
    firstLine = data.readline().split('\t')
    for e in firstLine:
        dict[e] = 0
    p = re.compile(pattern, re.IGNORECASE)
    for line in data:
        line = line.split('\t')
        for item in line:
            if p.search(item):
                dict[firstLine[line.index(item)]] += 1
    countedColumns = sorted(dict.items(), key=operator.itemgetter(1))
    return countedColumns

if __name__ == '__main__':
    main()
