import React from 'react';
import * as ld from 'lodash';
import { div, span, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';

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

export const StructuredDarRp = hh(class StructuredDarRp extends React.PureComponent {

  /**
   * takes a JSON object of the structure { primary: [...], secondary: [...] } and returns HTML elements
   */
  format = translatedDataUse => {
    const formatted = ld.map(ld.keys(translatedDataUse), key => {
      const restrictions = translatedDataUse[key];
      if (!ld.isEmpty(restrictions)) {
        const listRestrictions = ld.map(restrictions, (restriction, i) => {
          const { code, description } = restriction;
          return span({ key: i }, [
            span({ style: BOLD }, code === null ? '' : code + ' '),
            span({ style: TEXT }, [description, '\n'])]);
        });
        return div({ style: { ...BOLD, margin: '8px 0px' }, key }, [`${ld.startCase(key)}:\n`, listRestrictions]);
      }
    });
    return formatted;
  };

  render() {
    const { translatedDataUse, headerStyle, textStyle} = this.props;
    if (!ld.isEmpty(headerStyle)) {
      ld.merge(HEADER, headerStyle);
    }
    if (!ld.isEmpty(textStyle)) {
      ld.merge(TEXT, textStyle);
    }

    return div({ style: ROOT }, [
      div({ style: HEADER }, 'Structured Research Purpose'),
      div({ style: TEXT }, this.format(translatedDataUse))
    ]);
  }
});
