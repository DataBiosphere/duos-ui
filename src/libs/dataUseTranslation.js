import * as fp from 'lodash/fp';

//NOTE: need to incorporate the generic core statements and the prefixes into this data struct for universal use
//NOTE: need to encapsulate values in true/false keys since there may be variations on what is expected for each attribute
//NOTE: values that have no expected value for true or valse should have it be set to null for exclusion in processing
const processedDiseaseString = (prefix, diseases) => {
  const diseaseArray = diseases.sort().map(disease => disease.label);
  const diseaseString = diseaseArray.length > 1 ? fp.join('; ')(diseaseArray) : diseaseArray[0];
  return {
    description: prefix + diseaseString,
    manualReview: false
  };
};

//NOTE: will need to create a mapper or key check to point the equivalent keys across all references to the same front-end definition
//Examples - forProfit, male, female, pediatric (and possible even more)
//NOTE: need to understand the differences between NMDS and MDS and NCTRL and CTRL for categorization sake
//NOTE: most likely will need to rewrite dependent components to use new interface
const translations = {
  hmb: {
    code: "HMB",
    srp: {
      description: 'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.'
    },
    dul: {
      true: {
        description: 'Use is permitted for a health, medical, or biomedical research purpose'
      },
      false: null
    },
    manualReview: false
  },
  poa: {
    code: 'POA',
    srp: {
      description: 'The primary aim of this research is for population, origin, or ancestry research',
    },
    dul: {
      true: {
        description: 'Use is limited to population, origin, or ancestry research'
      },
      false: null
    },
    manualReview: true
  },
  diseases: (diseases) => {
    return {
      code: 'DS',
      srp: {
        description: processedDiseaseString('The primary aim of this research is for ', diseases)
      },
      dul: {
        true: {
          description: processedDiseaseString('Use is permitted for '),
        },
        false: null
      },
      manualReview: false
    };
  },
  //NOTE: figure out if this needs to be removed or not 
  researchTypeDisease: {
    code: 'DS',
    description: 'The primary purpose of the research is to learn more about a particular disease or disorder, a trait, or a set of related conditions.',
    manualReview: false
  },
  //NOTE: need to know how to format this string for srp and dul
  other: (otherText) => {
    return {
      code: 'OTHER',
      description: fp.isEmpty(otherText) ? "Other: Not provided" : otherText,
      manualReview: true
    };
  },
  //srp only
  methods: {
    code: 'MDS',
    srp: {
      description: 'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data. Data will be used for developing and/or validating new methods.',
    },
    dul: null,
    manualReview: false
  },
  //srp only
  controls: {
    code: 'CTRL',
    srp: {
      description: 'The reason for this request is to increase the number of controls available for a comparison group.'
    },
    dul: null,
    manualReview: false
  },
  forProfit: {
    code: 'NCU',
    srp:{
      description: 'This research is not-for-profit and non-commercial.'
    },
    dul: {
      true: {
        description: 'Use is limited to not-for-profit and non-commercial.'
      },
      false: {
        description: 'Use is not limited to not-for-profit and non-commercial.'
      }
    },
    manualReview: false
  },
  genderFemale: {
    code: 'POP-F',
    srp: {
      description: 'This research is limited to studies about females.',
    },
    dul: {
      true: {
        description: 'Use is limited to studies about females.'
      },
      false: null
    },
    manualReview: false
  },
  genderMale: {
    code: 'POP-M',
    srp: {
      description: 'The dataset will be used for studies about males.'
    },
    dul: {
      true: {
        description: 'Use is limited to studies about males.'
      },
      false: null
    },
    manualReview: false
  },
  pediatric: {
    code: 'POP-P',
    srp: {description: 'The dataset will be used for the study of children.'},
    dul: {
      true: {
        description: 'The dataset will be used for pediatric research.'
      },
      false: null
    },
    manualReview: false
  },
  //srp only?
  illegalBehavior: {
    code: 'OTHER',
    srp: {description: 'The dataset will be used for the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization).'},
    dul: null,
    manualReview: true
  },
  //srp only?
  addiction: {
    code: 'OTHER',
    srp: {description: 'The dataset will be used for the study of alcohol or drug abuse, or abuse of other addictive products.'},
    dul: null,
    manualReview: true
  },
  //srp only?
  sexualDiseases: {
    code: 'OTHER',
    srp: {description: 'The dataset will be used for the study of sexual preferences or sexually transmitted diseases.'},
    dul: null,
    manualReview: true
  },
  //srp only?
  stigmatizedDiseases: {
    code: 'OTHER',
    srp: {description: 'The dataset will be used for the study of stigmatizing illnesses.'},
    dul: null,
    manualReview: true
  },
  //srp only?
  vulnerablePopulation: {
    code: 'OTHER',
    srp: {description: 'The dataset will be used for a study targeting a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or [SIGNIFICANTLY] economically or educationally disadvantaged persons).'},
    dul: null,
    manualReview: true
  },
  //srp only?
  psychiatricTraits: {
    code: 'OTHER',
    srp: {description: 'The dataset will be used for the study of psychological traits, including intelligence, attention, emotion.'},
    dul: null,
    manualReview: true
  },
  //srp only?
  notHealth: {
    code: 'OTHER',
    srp: {description: 'The dataset will be used for the research that correlates ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways may not be easily related to Health.'},
    dul: null,
    manualReview: true
  },
  //dul only?
  geneticStudiesOnly: {
    code: 'GSO',
    srp: {
      description: 'This research includes genetic studies only.'
    },
    dul: {
      true: {
        description: 'Use is limited to genetic studies only'
      },
      false: null
    },
    //what is this value?
    manualReview: false
  },
  publicationResults: {
    code: 'PUB',
    srp: {
      description: 'The researcher will make results of studies using the data available to the larger scientific community'
    },
    dul: {
      true: {
        description: 'Use requires users to make results of studies using the data availbale to the larger scientific community.'
      },
      false: null
    },
    //what should this value be?
    manualReview: false
  },
  collaboratorRequired: {
    code: 'COL',
    srp: {
      description: 'The researcher will collaborate with the primary study investigators.'
    },
    dul: {
      true: {
        description: 'Use requires users to collaborate with the primary study investigators.'
      },
      false: null
    },
    //What should this value be?
    manualReview: false
  },
  ethicsApprovalRequired: {
    code: 'IRB',
    srp: {
      description: 'The researcher will provide documentation of local IRB/ERB approval.'
    },
    dul: {
      true: {
        description: 'Use requires users to provide documentation of local IRB/ERB approval.'
      },
      false: null
    },
    //what should this value be?
    manualReview: false
  },
  geographicalRestriction: {
    code: 'GS',
    srp: {
      description: 'The research is within a certain gepgraphic area'
    },
    dul: {
      true: {
        description: 'Use is limited to within a certain geographic area'
      },
      false: null
    },
    //what should this value be?
    manualReview: false
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
      statementArray = fp.concat(statementArray)(translations.forProfit);
    }

    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'f') {
      statementArray = fp.concat(statementArray)(translations.genderFemale);
    }

    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'm') {
      statementArray = fp.concat(statementArray)(translations.genderMale);
    }

    if(darInfo.illegalBehavior) {
      statementArray = fp.concat(statementArray)(translations.illegalBehavior);
    }

    if(darInfo.addiction) {
      statementArray = fp.concat(statementArray)(translations.addiction);
    }

    if(darInfo.sexualDiseases) {
      statementArray = fp.concat(statementArray)(translations.sexualDiseases);
    }

    if(darInfo.stigmatizedDiseases) {
      statementArray = fp.concat(statementArray)(translations.stigmatizedDiseases);
    }

    if(darInfo.vulnerablePopulation) {
      statementArray = fp.concat(statementArray)(translations.vulnerablePopulation);
    }

    if(darInfo.populationMigration || darInfo.poa || darInfo.population) {
      statementArray = fp.concat(statementArray)(translations.poa);
    }

    if(darInfo.psychiatricTraits) {
      statementArray = fp.concat(statementArray)(translations.psychiatricTraits);
    }

    if(darInfo.notHealth) {
      statementArray = fp.concat(statementArray)(translations.notHealth);
    }

    return statementArray;
  },

  generateResearchTypes: (darInfo) => {
    let statementArray = [];

    if(darInfo.diseases) {
      statementArray = fp.concat(statementArray)(translations.researchTypeDisease);
    }

    if(darInfo.methods) {
      statementArray = fp.concat(statementArray)(translations.methods);
    }

    if(darInfo.controls) {
      statementArray = fp.concat(statementArray)(translations.controls);
    }

    if(darInfo.population || darInfo.poa) {
      statementArray = fp.concat(statementArray)(translations.poa);
    }

    if(darInfo.hmb) {
      statementArray = fp.concat(statementArray)(translations.hmb);
    }

    if(darInfo.other) {
      statementArray = fp.concat(statementArray)(translations.other(darInfo.otherText));
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
      const diseaseTranslation = translations.diseases(fp.clone(darInfo.diseases));
      dataUseSummary.primary = fp.uniq(fp.concat(dataUseSummary.primary)(diseaseTranslation));
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

export const translatedUseStatements = function(darInfo, type) {
  //singlePhrases will contain the core message that is shared by both sRP and DULs
  //pronouns can be prefixed to these central definitions
  const singlePhrases = {
    nres: 'any purpose without restrictions.',
    gru: 'any research purpose.',
    hmb: 'a health, medical, or biomedical research purpose.',
    ds: 'for reasearch on the specified disease(s).',
    poa: 'population, origin, or ancestry research.',
    mds: 'methods development research (e.g., development of software or algorithms).',
    nmds: 'methods development research (e.g., development of software or algorithms) only within the bounds of other use limitations.',
    gso: 'genetic studies only.',
    npu: 'not-for-profit and non-commercial.',
    pub: 'make results of studies using the data available to the larger scientific community.',
    col: 'collaborate with the primary study investigators',
    irb: 'provide documentation of local IRB/ERB approval',
    gs: 'within a certain geographic area',
    mor: 'withold from publishing until the specified date',
    rt: 'return derived/enriched data to the database/resource'
  };

  const prefixPhrases = {
    nres: {
      srp: null,
      dul: 'Use is permited for '
    },
    gru: {
      srp: null,
      dul: 'Use is permitted for '
    },
    hmb: {
      srp: 'The primary aim of this research is ',
      dul: 'Use is permitted for '
    },
    ds: {
      srp: 'The primary aim of this research is ',
      dul: 'Use is permitted for '
    },
    poa: {
      srp: 'The primary aim of this research is ',
      dul: 'Use is limited to '
    },
    mds: {
      dul: null,
      srp: 'This research includes '
    },
    nmds: {
      dul: 'Use for ',
      srp: null
    },
    gso: {
      dul: 'Use is limited to ',
      srp: 'This research includes '
    },
    npu: {
      dul: 'Use is limited to ',
      srp: 'This research is '
    },
    pub: {
      dul: 'Use requires user to ',
      srp: 'The researcher will '
    },
    col: {
      dul: 'Use requires users to ',
      srp: 'The reseracher will '
    },
    irb: {
      dul: 'Use requires users to ',
      srp: 'The researcher will '
    },
    gs: {
      dul: 'Use is limited to ',
      srp: 'The research is '
    },
    mor: {
      dul: 'Use requires users to ',
      srp: 'The researcher will '
    },
    rt: {
      dul: 'Use requires users to ',
      srp: 'The researcher will '
    }
  };

  const generateStatements = function (darInfo, type) {
    if(!type || !darInfo) {return [];}

    const keys = Object.keys(singlePhrases);
    let returnStatements = [];
    keys.forEach(key => {
      if(prefixPhrases[key][type] && darInfo[key]) {
        returnStatements.push({
          description: prefixPhrases[key][type] + singlePhrases[key],
          key: key
        });
      }
    });

    return returnStatements;
  };

  return generateStatements(darInfo, type);
};
