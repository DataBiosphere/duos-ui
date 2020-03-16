import React from 'react';
import _ from 'lodash';
import { div, span, a, i, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { Files } from '../libs/ajax';
import { download } from '../libs/utils';

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

const ICON = {
  color: Theme.palette.link,
  marginRight: '6px',
};

export const StructuredRp = hh(class StructuredRp extends React.PureComponent {
  /**
   * converts the given string to the desired use restrictions object
   * this will be deleted once we implement returning the JSON object from the API
   */
  toObject = content => {
    const lines = content.split('<br>');
    lines.shift(); // gets rid of that "Samples are restricted..." line
    lines.pop();
    const formatObject = {
      primary: [],
      secondary: []
    };

    lines.forEach(line => {
      let code, description;
      const { primary, secondary } = formatObject;
      const primaryCodes = ["NRES", "GRU", "HMB", "DS", "POA"];
      if (line.includes('[')) {
        // separate code between brackets from rest of statement
        const arr = line.split(' [');
        code = arr[1].substring(0, arr[1].indexOf(']')); // text between brackets
        description = arr[0];
        primaryCodes.includes(code) ? primary.push({ code, description }) : secondary.push({ code, description });
      } else {
        code = null;
        description = line;
        secondary.push({ code, description });
      }
    });
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
        return span({ style: BOLD, key }, [`${_.startCase(key)}:\n`, listRestrictions]);
      };
    });
    return formatted;
  };

  render() {
    const { darInfo, election } = this.props;
    const mrDAR = JSON.stringify(election.useRestriction, null, 2);

    return div({ style: ROOT }, [
      div({ style: HEADER }, 'Structured Research Purpose'),
      div({ style: TEXT }, this.format(this.toObject(darInfo.structuredRp))),
      div({ style: { margin: '8px 0px' } }, [
        a({
          id: 'download-dar',
          onClick: () => download('machine-readable-DAR.json', mrDAR)
        },
          [
            i({ className: 'glyphicon glyphicon-download-alt', style: ICON }),
            'DAR machine-readable format'
          ])
      ]),
    ]);
  }
});
