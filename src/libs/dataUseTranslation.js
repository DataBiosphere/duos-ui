import forEach from 'lodash/fp/forEach';
import isNil from 'lodash/fp/isNil';
import isEmpty from 'lodash/fp/isEmpty';
import join from 'lodash/fp/join';
import concat from 'lodash/fp/concat';
import clone from 'lodash/fp/clone';
import uniq from 'lodash/fp/uniq';

const srpTranslations = {
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
    const diseaseArray = diseases.sort().map(disease => disease.label);
    const diseaseString = diseaseArray.length > 1 ? join('; ')(diseaseArray) : diseaseArray[0];
    return {
      code: 'DS',
      description: 'Disease-related studies: ' + diseaseString,
      manualReview: false
    };
  },
  researchTypeDisease: {
    code: 'DS',
    description: 'The primary purpose of the research is to learn more about a particular disease or disorder, a trait, or a set of related conditions.',
    manualReview: false
  },
  other: (otherText) => {
    return {
      code: 'OTHER',
      description: isEmpty(otherText) ? "Other: Not provided" : otherText,
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
    description: 'The dataset will be used for the research that correlates ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways may not be easily related to Health.',
    manualReview: true
  }
};

const consentTranslations = {
  generalUse: {
    code: 'GRU',
    description: 'Use is permitted for any use'
  },
  hmbResearch: {
    code: 'HMB',
    description: 'Use is permitted for a health, medical, or biomedical research purpose'
  },
  diseaseRestrictions: (restrictions) => {
    if (restrictions.length < 1) { return 'Use is permitted for the specified disease(s): Not specified'; }
    const restrictionList = restrictions.join(', ');
    return {
      code: 'DS',
      description: `Use is permitted for the specified disease(s): ${restrictionList}`
    };
  },
  populationOriginsAncestry: {
    code: 'POA',
    description: 'Use is limited to population, origin, or ancestry research'
  },
  methodsResearch: {
    code: 'NMDS',
    description: 'Use for methods development research (e.g., development of software or algorithms) only within the bounds of other use limitations'
  },
  geneticStudiesOnly: {
    code: 'GSO',
    description: 'Use is limited to genetic studies only'
  },
  commercialUse: {
    code: 'NPU',
    description: 'Use is limited to non-profit and non-commercial'
  },
  publicationResults: {
    code: 'PUB',
    description: 'Use requires users to make results of studies using the data available to the larger scientific community'
  },
  collaboratorRequired: {
    code: 'COL',
    description: 'Use requires users to collaborate with the primary study investigators'
  },
  ethicsApprovalRequired: {
    code: 'IRB',
    description: 'Use requires users to provide documentation of local IRB/ERB approval'
  },
  geographicalRestrictions: {
    code: 'GS',
    description: 'Use is limited to within a certain geographic area'
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
      statementArray = concat(statementArray)(srpTranslations.forProfit);
    }

    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'f') {
      statementArray = concat(statementArray)(srpTranslations.genderFemale);
    }

    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'm') {
      statementArray = concat(statementArray)(srpTranslations.genderMale);
    }

    if(darInfo.illegalBehavior) {
      statementArray = concat(statementArray)(srpTranslations.illegalBehavior);
    }

    if(darInfo.addiction) {
      statementArray = concat(statementArray)(srpTranslations.addiction);
    }

    if(darInfo.sexualDiseases) {
      statementArray = concat(statementArray)(srpTranslations.sexualDiseases);
    }

    if(darInfo.stigmatizedDiseases) {
      statementArray = concat(statementArray)(srpTranslations.stigmatizedDiseases);
    }

    if(darInfo.vulnerablePopulation) {
      statementArray = concat(statementArray)(srpTranslations.vulnerablePopulation);
    }

    if(darInfo.populationMigration || darInfo.poa || darInfo.population) {
      statementArray = concat(statementArray)(srpTranslations.poa);
    }

    if(darInfo.psychiatricTraits) {
      statementArray = concat(statementArray)(srpTranslations.psychiatricTraits);
    }

    if(darInfo.notHealth) {
      statementArray = concat(statementArray)(srpTranslations.notHealth);
    }

    return statementArray;
  },

  generateResearchTypes: (darInfo) => {
    let statementArray = [];

    if(darInfo.diseases) {
      statementArray = concat(statementArray)(srpTranslations.researchTypeDisease);
    }

    if(darInfo.methods) {
      statementArray = concat(statementArray)(srpTranslations.methods);
    }

    if(darInfo.controls) {
      statementArray = concat(statementArray)(srpTranslations.controls);
    }

    if(darInfo.population || darInfo.poa) {
      statementArray = concat(statementArray)(srpTranslations.poa);
    }

    if(darInfo.hmb) {
      statementArray = concat(statementArray)(srpTranslations.hmb);
    }

    if(darInfo.other) {
      statementArray = concat(statementArray)(srpTranslations.other(darInfo.otherText));
    }
    return statementArray;
  },

  translateDarInfo: (darInfo) => {
    let dataUseSummary = {
      primary: [],
      secondary: [],
    };

    // Primary Codes

    if (darInfo.hmb) {
      dataUseSummary.primary = concat(dataUseSummary.primary,
        srpTranslations.hmb);
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
      dataUseSummary.primary = concat(dataUseSummary.primary)(srpTranslations.poa);
    }
    if (darInfo.diseases && !isEmpty(darInfo.diseases)) {
      const diseaseTranslation = srpTranslations.diseases(clone(darInfo.diseases));
      dataUseSummary.primary = uniq(concat(dataUseSummary.primary)(diseaseTranslation));
    }
    if (darInfo.other) {
      dataUseSummary.primary = concat(dataUseSummary.primary)(srpTranslations.other(darInfo.otherText));
    }

    // Secondary Codes

    if (darInfo.methods) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.methods);
    }
    if (darInfo.controls) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.controls);
    }
    if (darInfo.forProfit) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.forProfit);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'f') {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.genderFemale);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'm') {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.genderFemale);
    }
    if (darInfo.pediatric) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.pediatric);
    }
    if (darInfo.illegalBehavior) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.illegalBehavior);
    }
    if (darInfo.addiction) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.addiction);
    }
    if (darInfo.sexualDiseases) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.sexualDiseases);
    }
    if (darInfo.stigmatizedDiseases) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.stigmatizedDiseases);
    }
    if (darInfo.vulnerablePopulation) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.vulnerablePopulation);
    }
    if (darInfo.psychiatricTraits) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.psychiatricTraits);
    }
    if (darInfo.notHealth) {
      dataUseSummary.secondary = concat(dataUseSummary.secondary)(srpTranslations.notHealth);
    }

    return dataUseSummary;
  },

  translateDataUseRestrictions: (dataUse) => {
    if(!dataUse) {return [];}

    let restrictionStatements = [];
    let targetKeys = Object.keys(consentTranslations);
    forEach((key) => {
      const value = dataUse[key];
      if(!isNil(value) && value) {
        if(key === 'diseaseRestrictions') {
          restrictionStatements.push(consentTranslations.diseaseRestrictions(value));
        } else {
          restrictionStatements.push(consentTranslations[key]);
        }
      }
    })(targetKeys);

    return restrictionStatements;
  }

};
