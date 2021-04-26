import React from 'react';
import _ from 'lodash';
import { div, span, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { DownloadLink } from '../../components/DownloadLink';

const ROOT = {
  fontFamily: 'Arial',
  color: Theme.palette.primary,
  whiteSpace: 'pre-line'
};

const HEADER = {
  marginBottom: '5px',
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.semibold,
  color: Theme.palette.highlighted,
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

export const StructuredLimitations = hh(class StructuredLimitations extends React.PureComponent {
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
      div({ style: HEADER }, 'Data Use Structured Limitations'),
      div({ style: TEXT }, this.format(content)),
      div(this.makeLinks(labels, functions)),
    ]);
  }
});
