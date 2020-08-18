import * as fp from 'lodash/fp';

export const DataUseTranslation = {

  /**
   * Translates a raw data access request into an ontology service compatible
   * DataUseSummary object that reflects a Data Access Request instead of a Consent.
   * See https://consent-ontology.dsde-prod.broadinstitute.org/#/Data%20Use/post_translate_summary
   *
   * @param darInfo
   * @returns {{primary: [{code: '', description: ''}], secondary: [{code: '', description: ''}]}}
   */
  translateDarInfo: (darInfo) => {
    let dataUseSummary = {
      primary: [],
      secondary: [],
    };

    // Primary Codes

    if (darInfo.hmb) {
      const dataUseElement = {
        code: 'HMB',
        description: 'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.',
      };
      dataUseSummary.primary = fp.concat(dataUseSummary.primary,
        dataUseElement);
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
      const dataUseElement = {
        code: 'POA',
        description: 'The dataset will be used for the study of Population Origins/Migration patterns.',
      };
      dataUseSummary.primary = fp.concat(dataUseSummary.primary)(dataUseElement);
    }
    if (darInfo.diseases && !fp.isEmpty(darInfo.diseases)) {
      const diseaseArray = darInfo.diseases.sort();
      const diseaseString = diseaseArray.length > 1 ? fp.join('; ')(diseaseArray) : diseaseArray[0];
      const dataUseElement = {
        code: 'DS',
        description: 'Disease-related studies: ' + diseaseString
      };
      dataUseSummary.primary = fp.uniq(fp.concat(dataUseSummary.primary)(dataUseElement));
    }
    if (darInfo.other) {
      const dataUseElement = {
        code: 'OTHER',
        description: fp.isEmpty(darInfo.otherText) ? "Not provided" : darInfo.otherText,
      };
      dataUseSummary.primary = fp.concat(dataUseSummary.primary)(dataUseElement);
    }

    // Secondary Codes

    if (darInfo.methods) {
      const dataUseElement = {
        code: 'MDS',
        description: 'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data. Data will be used for developing and/or validating new methods.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.controls) {
      const dataUseElement = {
        code: 'CTRL',
        description: 'The reason for this request is to increase the number of controls available for a comparison group.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.forProfit) {
      const dataUseElement = {
        code: 'NCU',
        description: 'The dataset will be used in a study related to a commercial purpose.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'f') {
      const dataUseElement = {
        code: 'POP-F',
        description: 'The dataset will be used for the study of females.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.gender && darInfo.gender.slice(0, 1).toLowerCase() === 'm') {
      const dataUseElement = {
        code: 'POP-M',
        description: 'The dataset will be used for the study of males.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.pediatric) {
      const dataUseElement = {
        code: 'POP-P',
        description: 'The dataset will  be used for the study of children.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.illegalBehavior) {
      const dataUseElement = {
        code: 'OTHER',
        description: 'The dataset will be used for the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization).',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.addiction) {
      const dataUseElement = {
        code: 'OTHER',
        description: 'The dataset will be used for the study of alcohol or drug abuse, or abuse of other addictive products.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.sexualDiseases) {
      const dataUseElement = {
        code: 'OTHER',
        description: 'The dataset will be used for the study of sexual preferences or sexually transmitted diseases.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.stigmatizedDiseases) {
      const dataUseElement = {
        code: 'OTHER',
        description: 'The dataset will be used for the study of stigmatizing illnesses.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.vulnerablePopulation) {
      const dataUseElement = {
        code: 'OTHER',
        description: 'The dataset will be used for a study targeting a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or [SIGNIFICANTLY] economically or educationally disadvantaged persons).',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.psychiatricTraits) {
      const dataUseElement = {
        code: 'OTHER',
        description: 'The dataset will be used for the study of psychological traits, including intelligence, attention, emotion.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }
    if (darInfo.notHealth) {
      const dataUseElement = {
        code: 'OTHER',
        description: 'The dataset will be used for the research that correlates  ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways may not be easily related to Health.',
      };
      dataUseSummary.secondary = fp.concat(dataUseSummary.secondary)(dataUseElement);
    }

    return dataUseSummary;
  },

};
