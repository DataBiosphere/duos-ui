import React from 'react';
import _ from 'lodash';
import { div, span, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { DownloadLink } from './DownloadLink';

const ROOT = {
  fontFamily: 'Montserrat',
  color: Theme.palette.primary,
  whiteSpace: 'pre-line'
};

const HEADER = {
  marginBottom: '5px',
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.semibold,
};

const TEXT = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.regular,
};

const BOLD = {
  ...TEXT,
  fontWeight: Theme.font.weight.semibold,
};

export const StructuredRp = hh(class StructuredRp extends React.PureComponent {
  /**
   * converts the given data to the desired use restrictions object
   */
  toObject = content => {
    const formatObject = {
      primary: [],
      diseases: [],
      secondary: []
    };
    const { primary, secondary, diseases } = formatObject;

    if (content.diseases) {
      primary.push({ code: "HMB", description: "Data will be used for health/medical/biomedical research." });
    };

    if (content.methods) {
      primary.push({ code: "NMDS", description: "Data will be used for methods development research." });
    };

    if (content.controls) {
      primary.push({ code: "NCTRL", description: "Data will be used as a control sample set." });
    };

    if (content.population) {
      primary.push({ code: "NPNV", description: "Data will be used for population structure or normal variation studies." });
    };

    if (!_.isEmpty(content.ontologies)) {
      content.ontologies.forEach(ontology => {
        const { label, id } = ontology;
        const code = _.startCase(id.substring(id.lastIndexOf("/") + 1)); // startCase removes underscores
        diseases.push({ code, description: label });
      });
    };

    if (content.forProfit) {
      secondary.push({ code: "NPU", description: "Data will be used for commercial purpose." });
    } else {
      secondary.push({ code: null, description: "Data will not be used for commercial purpose." });
    };

    if (content.oneGender) {
      let gender = content.gender;
      if (gender !== null) {
        gender = gender === "M" ? "male" : "female";
        secondary.push({ code: "RS-[GENDER]", description: `Data will be used to study ONLY a ${gender} population.` });
      };
    };

    if (content.pediatric) {
      secondary.push({ code: "RS-[PEDIATRIC]", description: "Data will be used to study ONLY a pediatric population." });
    };

    return formatObject;
  };

  /**
   * takes a JSON object of the structure { primary: [...], secondary: [...] } and returns HTML elements
   */
  format = content => {
    const formatted = _.map(_.keys(content), key => {
      const restrictions = content[key];
      if (!_.isEmpty(restrictions)) {
        const listRestrictions = _.map(restrictions, (restriction, i) => {
          const { code, description } = restriction;
          return span({ key: i }, [
            span({ style: BOLD }, code === null ? '' : code + ' '),
            span({ style: TEXT }, [description, '\n'])]);
        });
        return div({ style: { ...BOLD, margin: '8px 0px' }, key }, [`${_.startCase(key)}:\n`, listRestrictions]);
      };
    });
    return formatted;
  };

  /**
   * renders the download links passed in as props
   */
  makeLinks = (labels, functions) => {
    return _.map(labels, (label, i) => {
      return DownloadLink({ key: i, label, onDownload: functions[i] });
    });
  };

  render() {
    const { content, labels, functions } = this.props;

    return div({ style: ROOT }, [
      div({ style: HEADER }, 'Structured Research Purpose'),
      div({ style: TEXT }, this.format(this.toObject(content))),
      div(this.makeLinks(labels, functions)),
    ]);
  }
});
