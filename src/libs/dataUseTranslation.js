import * as fp from 'lodash/fp';

const translations = {
  hmb: {
    code: "HMB",
    description: 'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.',
    manualReview: false
  },
  poa: {
    code: 'POA',
    desciption: 'The dataset will be used for the study of Population Origins/Migration patterns.',
    manualReview: true
  },
  diseases: (diseases) => {
    const diseaseArray = diseases.sort();
    const diseaseString = diseaseArray.length > 1 ? fp.join('; ')(diseaseArray) : 'N/A';
    return {
      code: 'DS',
      description: 'Disease-related studies: ' + diseaseString,
      manualReview: false
    };
  },
  other: (otherText) => {
    return {
      code: 'OTHER',
      description: fp.isEmpty(otherText) ? "Not provided" : otherText,
      manualReview: true
    };
  },
  methods: {
    code: 'MDS',
    description: 'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data. Data will be used for developing and/or validating new methods.',
    manualReview: false
  },
  controls: {
    code: 'CTRL',
    description: 'The reason for this request is to increase the number of controls available for a comparison group.',
    manualReview: false
  },
  forProfit: {
    code: 'NCU',
    description: 'The dataset will be used in a study related to a commercial purpose.',
    manualReview: false
  },
  genderFemale: {
    code: 'POP-F',
    description: 'The dataset will be used for the study of females.',
    manualReview: false
  },
  genderMale: {
    code: 'POP-M',
    description: 'The dataset will be used for the study of males.',
    manualReview: false
  },
  pediatric: {
    code: 'POP-P',
    description: 'The dataset will be used for the study of children.',
    manualReview: false
  },
  illegalBehavior: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization).',
    manualReview: true
  },
  addiction: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of alcohol or drug abuse, or abuse of other addictive products.',
    manualReview: true
  },
  sexualDiseases: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of sexual preferences or sexually transmitted diseases.',
    manualReview: true
  },
  stigmatizedDiseases: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of stigmatizing illnesses.',
    manualReview: true
  },
  vulnerablePopulation: {
    code: 'OTHER',
    description: 'The dataset will be used for a study targeting a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or [SIGNIFICANTLY] economically or educationally disadvantaged persons).',
    manualReview: true
  },
  psychiatricTraits: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of psychological traits, including intelligence, attention, emotion.',
    manualReview: true
  },
  notHealth: {
    code: 'OTHER',
    description: 'The dataset will be used for the research that correlates  ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways may not be easily related to Health.',
    manualReview: true
  }
};

export const DataUseTranslation = {

  /**
   * Translates a raw data access request into an ontology service compatible
   * DataUseSummary object that reflects a Data Access Request instead of a Consent.
   * See https://consent-ontology.dsde-prod.broadinstitute.org/#/Data%20Use/post_translate_summary
   *
   * @param darInfo
   * @returns {{primary: [{code: '', description: ''}], secondary: [{code: '', description: ''}]}}
   */

  //NOTE: backend categorization of purposeStatement/researchType differs from front-end primary/secondary designations
  //Reminder to phase out purposeStatement/researchType as we transition to new front-end spec
  generatePurposeStatement: (darInfo) => {
    let statementArray = [];
    if(darInfo.forProfit) {
      fp.concat(statementArray)(translations.forProfit);
    }

    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'f') {
      fp.concat(statementArray)(translations.genderFemale);
    }

    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'm') {
      fp.concat(statementArray)(translations.genderMale);
    }

    if(darInfo.illegalBehavior) {
      fp.concat(statementArray)(translations.illegalBehavior);
    }

    if(darInfo.addiction) {
      fp.concat(statementArray)(translations.addiction);
    }

    if(darInfo.sexualDiseases) {
      fp.concat(statementArray)(translations.sexualDiseases);
    }

    if(darInfo.stigmatizedDiseases) {
      fp.concat(statementArray)(translations.stigmatizedDiseases);
    }

    if(darInfo.vulnerablePopulation) {
      fp.concat(statementArray)(translations.vulnerablePopulation);
    }

    if(darInfo.populationMigration || darInfo.poa || darInfo.population) {
      fp.concat(statementArray)(translations.poa);
    }

    if(darInfo.psychiatricTraits) {
      fp.concat(statementArray)(translations.psychiatricTraits);
    }

    if(darInfo.notHealth) {
      fp.concat(statementArray)(translations.notHealth);
    }

    return statementArray;
  },

  generateResearchTypes: (darInfo) => {
    let statementArray = [];

    if(darInfo.diseases) {
      fp.uniq(fp.concat(statementArray)(translations.diseases(darInfo.diseases)));
    }

    if(darInfo.methods) {
      fp.concat(statementArray)(translations.method);
    }

    if(darInfo.controls) {
      fp.concat(statementArray)(translations.controls);
    }

    if(darInfo.population || darInfo.poa) {
      fp.concat(statementArray)(translations.poa);
    }

    if(darInfo.hmb) {
      fp.concat(statementArray)(translations.hmb);
    }

    if(darInfo.other) {
      fp.concat(statementArray)(darInfo.otherText);
    }
  },

  translateDarInfo: (darInfo) => {
    let dataUseSummary = {
      primary: [],
      secondary: [],
    };

    // Primary Codes

    if (darInfo.hmb) {
      dataUseSummary.primary = fp.concat(dataUseSummary.primary,
        translations.hmb);
    }
    /**
     * TODO: Resolve confusion on consent/ontology/orsp sides
     *
     * population refers to question 2.3.2
     *      The outcome of this study is expected to provide new knowledge about the origins of a certain population or its ancestry.
     *      Code is clearly POA
     * populationMigration refers to question 3.1.9
     *      Does the research aim involve the study of Population Origins/Migration patterns?
     *
     * Tracing this through to Ontology, both refer to http://purl.obolibrary.org/obo/DUO_0000011 which is POA
     */
    if (darInfo.poa || darInfo.population || darInfo.populationMigration) {
      dataUseSummary.primary = fp.concat(dataUseSummary.primary)(translations.poa);
    }
    if (darInfo.diseases && !fp.isEmpty(darInfo.diseases)) {
      dataUseSummary.primary = fp.uniq(fp.concat(dataUseSummary.primary)(translations.diseases(darInfo)));
    }
    if (darInfo.other) {
      dataUseSummary.primary = fp.concat(dataUseSummary.primary)(translations.other(darInfo.otherText));
    }

    // Secondary Codes

    if (darInfo.methods) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.methods);
    }
    if (darInfo.controls) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.controls);
    }
    if (darInfo.forProfit) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.forProfit);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'f') {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.genderFemale);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'm') {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.genderFemale);
    }
    if (darInfo.pediatric) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.pediatric);
    }
    if (darInfo.illegalBehavior) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.illegalBehavior);
    }
    if (darInfo.addiction) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.addiction);
    }
    if (darInfo.sexualDiseases) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.sexualDiseases);
    }
    if (darInfo.stigmatizedDiseases) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.stigmatizedDiseases);
    }
    if (darInfo.vulnerablePopulation) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.vulnerablePopulation);
    }
    if (darInfo.psychiatricTraits) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.psychiatricTraits);
    }
    if (darInfo.notHealth) {
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(translations.notHealth);
    }

    return dataUseSummary;
  },

};
