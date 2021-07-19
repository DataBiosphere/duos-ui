import React from 'react';
import * as ld from 'lodash';
import { div, hh, img } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import cardImg from '../../images/card.png';
import { isEmpty } from 'lodash';

const HEADER = {
  margin: '10px 0px',
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  fontWeight: Theme.font.weight.semibold,
};

const TEXT = {
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.regular,
  margin: '4px 0px',
};

const BOLD = {
  ...TEXT,
  fontWeight: Theme.font.weight.semibold,
};

export const ApplicantInfo = hh(
  class ApplicantInfo extends React.PureComponent {
    formatResearcherInfo = content => {
      return ld.map(ld.keys(content), key => {
        return div({ key, style: { maxWidth: `${100 / 6}%` } }, [
          div({ style: BOLD }, ld.startCase(key)),
          div({ style: TEXT }, content[key]),
        ]);
      });
    };
    formatLibraryCard = (cards) => {
      return ld.map(cards, (card) => {
        if (isEmpty(card) || isEmpty(card.institution)) {
          return div({});
        }
        const { institution } = card;
        return div({ style: { margin: 3, textAlign: 'center' } }, [
          img({
            id: 'card_' + card,
            src: cardImg,
            style: { width: 51, height: 40 },
          }),
          div(
            {
              style: {
                marginTop: 2,
                color: 'white',
                backgroundColor: '#00928A',
                borderRadius: 3,
                textAlign: 'center',
                paddingLeft: 3,
                paddingRight: 3,
                maxWidth: 150
              },
            },
            [institution.name]),
        ]);
      });
    };

    render() {
      const { content, researcherProfile, institution } = this.props;
      const libraryCards = ld.get(researcherProfile, 'libraryCards', []);
      return div(
        { style: { fontFamily: 'Arial', color: Theme.palette.primary } }, [
          div({ style: HEADER }, 'Applicant Information'),
          div({ style: { display: 'flex', justifyContent: 'space-between' }},
            this.formatResearcherInfo(content)),
          div({ isRendered: !ld.isEmpty(libraryCards) },
            [
              div({ style: {...HEADER, margin: '20px 0'} }, 'Library Cards'),
              div({ style: { display: 'flex', flexFlow: 'row wrap' } },
                this.formatLibraryCard(libraryCards, institution)),
            ]),
        ]);
    }
  });
