import React from 'react';
import _ from 'lodash';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';

const TEXT = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.regular,
};

export const ApplicationSection = hh(class ApplicationSection extends React.PureComponent {
  render() {
    const { header, content, headerColor } = this.props;
    return div({ style: { fontFamily: 'Montserrat', color: Theme.palette.primary } }, [
      div({
        style: {
          marginBottom: '5px',
          fontSize: Theme.font.size.header,
          lineHeight: Theme.font.leading.regular,
          fontWeight: Theme.font.weight.semibold,
          color: headerColor,
        }
      }, header),
      div({ style: TEXT }, content)
    ]);
  }
});
