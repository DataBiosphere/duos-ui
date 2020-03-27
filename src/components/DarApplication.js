import React from 'react';
import { div, span, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { Files } from '../libs/ajax';
import { AppSummary } from './AppSummary';
import { DownloadLink } from './DownloadLink';

const SECTION = {
  fontFamily: 'Montserrat',
  margin: '16px 0px 5px 0px',
  color: Theme.palette.primary,
  display: 'flex',
};

const HEADER = {
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
};

const HEADER_BOLD = {
  ...HEADER,
  fontWeight: Theme.font.weight.semibold,
};

export const DarApplication = hh(class DarApplication extends React.PureComponent {

  downloadDAR = () => {
    Files.getDARFile(this.props.ids.darId);
  };

  render() {
    const { voteAsChair, darInfo, election, consent } = this.props;
    return div([
      div({ id: 'header', style: SECTION }, [
        div({ style: { minWidth: '50%' } }, [
          span({ style: HEADER_BOLD }, darInfo.projectTitle),
          span({ style: HEADER }, " | " + darInfo.darCode)
        ]),
        DownloadLink({ label: 'Full Application', onDownload: this.downloadDAR })
      ]),
      div({ id: 'votes-summary', isRendered: voteAsChair }),
      AppSummary({ darInfo, election, consent })
    ]);
  }
});
