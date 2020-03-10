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
  color: Theme.palette.hightlighted,
};

const TEXT = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.regular,
};

const BOLD = {
  ...TEXT,
  fontWeight: Theme.font.weight.semibold,
};

const ICON = {
  color: Theme.palette.link,
  marginRight: '6px',
};

export const StructuredLimitations = hh(class StructuredLimitations extends React.PureComponent {
  format = content => {
    const lines = content.split('\n');
    const formatted = _.map(lines, line => {
      if (line.includes('[')) {
        // separate code between brackets from rest of statement
        const arr = line.split(' [');
        const code = arr[1].substring(0, arr[1].indexOf(']')) + ' '; // text between brackets
        return span([
          span({ style: BOLD }, code),
          span({ style: TEXT }, arr[0]), '\n'])
      } else {
        return span(`${line}\n`);
      }
    });
    return formatted;
  };

  downloadDUL = () => {
    const { referenceId, dulName } = this.props.consentElection;
    Files.getDulFile(referenceId, dulName);
  };

  render() {
    const { darInfo, election, consentElection } = this.props;
    const mrDUL = JSON.stringify(election.useRestriction, null, 2);

    return div({ style: ROOT }, [
      div({ style: HEADER }, 'Data Use Structured Limitations'),
      div({ style: TEXT }, this.format(darInfo.structuredLimitations)),
      div({ style: { margin: '8px 0px' } }, [
        a({
          id: 'download-dul',
          onClick: () => download('machine-readable-DUL.json', mrDUL)
        },
          [
            i({ className: 'glyphicon glyphicon-download-alt', style: ICON }),
            'DUL machine-readable format'
          ])
      ]),
      div([
        a({
          id: 'download-letter',
          onClick: () => this.downloadDUL()
        },
          [
            i({ className: 'glyphicon glyphicon-download-alt', style: ICON }),
            'Data Use Letter'
          ])
      ])
    ]);
  }
});
