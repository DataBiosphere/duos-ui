import React from 'react';
import _ from 'lodash';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';

const HEADER = {
  margin: '10px 0px',
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.semibold,
};

const TEXT = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.regular,
  margin: '4px 0px'
};

const BOLD = {
  ...TEXT,
  fontWeight: Theme.font.weight.semibold,
};

export const ApplicantInfo = hh(class ApplicantInfo extends React.PureComponent {
  format = content => {
    return _.map(_.keys(content), key => {
      return div({ key, style: { maxWidth: `${100 / 6}%` } }, [
        div({ style: BOLD }, _.startCase(key)),
        div({ style: TEXT }, content[key])
      ]);
    });
  };
  render() {
    const { header, content } = this.props;
    return div({ style: { fontFamily: 'Montserrat', color: Theme.palette.primary } }, [
      div({
        style: HEADER
      }, "Applicant Information"),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, this.format(content)),
    ]);
  }
});