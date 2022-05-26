import React from 'react';
import { a, div, h, hh } from 'react-hyperscript-helpers';
import { Email } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';
import { Theme } from '../../libs/theme';
import { Chart } from 'react-google-charts';
import * as moment from 'moment';
import {isNil, filter, map} from 'lodash/fp';

const STYLE = {
  color: Theme.palette.primary,
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
  fontWeight: Theme.font.weight.semibold,
  fontFamily: 'Arial',
  backgroundColor: Theme.palette.background.secondary,
  padding: 16,
  borderRadius: '9px',
  margin: '16px 0'
};

const HEADER_STYLE = {
  fontSize: Theme.font.size.subheader,
  lineHeight: Theme.font.leading.regular,
  textTransform: 'uppercase',
  margin: '16px 0px',
  opacity: '70%',
};

const VOTE_STYLE = {
  borderRadius: 9,
  backgroundColor: '#DFE8EE',
  height: 180,
  width: 275,
  padding: 0,
  margin: '.5rem',
  overflowX: 'hidden',
  overflowY: 'scroll',
  display: 'flex',
  flexDirection: 'column'
};

const QUESTION_STYLE = {
  fontSize: Theme.font.size.superheader,
  lineHeight: Theme.font.leading.title,
  fontWeight: Theme.font.weight.regular,
  textTransform: 'none',
  margin: '16px 0px',
  borderBottom: '1px solid',
};

const baseOptions = {
  pieHole: 0.65,
  pieSliceText: 'none',
  pieSliceBorderColor: 'transparent',
  backgroundColor: 'transparent',
  chartArea: {
    left: 0,
    top: 10,
    right: 0,
    bottom: 10,
    width: '100%',
    height: '85%',
  },
  height: 120,
  legend: {
    position: 'right',
    textStyle: {
      fontName: 'Roboto',
      color: '#333333',
      bold: true,
      fontSize: 15,
    },
    pieSliceTextStyle: {
      color: 'white',
      fontSize: 16,
    },
    alignment: 'start',
    tooltip: {
      textStyle: {
        fontName: 'Roboto',
        color: '#333333',
        fontSize: 14,
      },
    },
  },
};

export const VoteSummary = hh(
  class VoteSummaryQuestionOne extends React.PureComponent {

    voteResultsBox = (data, options) => {
      return div({
        style: {
          borderRadius: 9,
          backgroundColor: '#D3E9EC',
          height: 180,
          width: 275,
          padding: '1rem',
          margin: '.5rem'
        },
      }, [
        div({}, [
          'Vote Results',
          h(Chart, {
            chartType: 'PieChart',
            data: data,
            loader: 'Loading...',
            options: options,
          }),
        ]),
      ]);
    };

    voteChart = (votes) => {
      const positiveVotes = filter(['vote', true])(votes).length;
      const negativeVotes = filter(['vote', false])(votes).length;
      const pendingVotes = filter(['vote', null])(votes).length;
      return [
        ['Results', 'Votes'],
        ['Yes', positiveVotes],
        ['No', negativeVotes],
        ['Pending', pendingVotes],
      ];
    };

    memberVote = (vote) => {
      const voteString = isNil(vote.vote.vote) ? 'Pending' : vote.vote.vote ? 'Yes' : 'No';
      const updateDateString = isNil(vote.vote.updateDate) ?
        moment(vote.vote.updateDate).format('MM/DD/YY')
        : !isNil(vote.vote.createDate) ?
          moment(vote.vote.createDate).format('MM/DD/YY')
          : '';
      return div({
        key: vote.vote.voteId,
        style: VOTE_STYLE
      }, [
        div({style: {flex: '1 0 auto', fontSize: Theme.font.size.small, fontWeight: Theme.font.weight.semibold, padding: '1rem'}}, [vote.displayName]),
        div({style: {flex: '1 0 auto', margin: 0, padding: 0, borderTop: '1px solid #BABEC1', height: 0}}, []),
        div({style: {flex: '1 0 auto', fontSize: Theme.font.size.small, fontWeight: Theme.font.weight.semibold, padding: '1rem'}}, [
          div({style: {display: 'flex', flexWrap: 'wrap'}}, [
            div({style:{padding: '0 1rem 1rem 0'}}, ['VOTE: ']),
            div({style:{padding: '0 1rem 1rem 0', fontWeight: Theme.font.weight.regular, minWidth: '7rem'}}, [voteString]),
          ]),
          div({style: {display: 'flex', flexWrap: 'wrap'}}, [
            div({style:{padding: '0 1rem 1rem 0'}}, ['DATE: ']),
            div({style:{fontWeight: Theme.font.weight.regular}}, [updateDateString]),
          ]),
          div({style: {}}, [
            div({style: {flex: '1 0 auto', padding: '0 1rem 1rem 0'}}, ['RATIONALE: ']),
            div({style: {flex: '1 0 auto', fontWeight: Theme.font.weight.regular}}, [vote.vote.rationale]),
          ]),
        ]),
        div({style: {
          padding: '1rem',
          textAlign: 'right',
          flexShrink: '0',
          fontWeight: Theme.font.weight.regular},
        isRendered: isNil(this.props.accessElection) ? false : this.props.accessElection.status === 'Open'
        }, [a({onClick: () => this.sendReminder(vote)}, ['Send Reminder'])])
      ]);
    };

    sendReminder = async (vote) => {
      const response = await Email.sendReminderEmail(vote.vote.voteId);
      if (response.status === 200) {
        Notifications.showSuccess({text: `Reminder email sent to: ${vote.email}`});
      } else {
        Notifications.showError({ text: `Unable to send reminder email: ${response.status}` });
      }
    };

    render() {
      const memberVotes = filter((v) => v.vote.type === 'DAC')(this.props.votes);
      const chairVotes = filter((v) => v.vote.type === 'Chairperson')(this.props.votes);
      const memberData = this.voteChart(map('vote')(memberVotes));
      const chairData = this.voteChart(map('vote')(chairVotes));
      const options = {
        ...baseOptions, ...{
          slices: {
            0: {color: '#00928A'}, // Yes
            1: {color: '#922200'}, // No
            2: {color: '#8CA4AC'}, // Pending
          },
        },
      };

      return div({}, [
        div({style: STYLE, id: 'vote-summary-question-one'}, [
          div({style: HEADER_STYLE},
            ['Question ', this.props.questionNumber, ':']),
          div({style: QUESTION_STYLE}, [this.props.question]),
          div({isRendered: this.props.isAdmin, style: HEADER_STYLE}, ['How committee chairs voted:']),
          div({isRendered: this.props.isAdmin,
            style: {
              display: 'flex',
              flexWrap: 'wrap',
            }
          },[
            this.voteResultsBox(chairData, options),
            map(this.memberVote)(chairVotes),
          ]),
          div({style: HEADER_STYLE}, ['How committee members voted:']),
          div({
            style: {
              display: 'flex',
              flexWrap: 'wrap',
            }
          },[
            this.voteResultsBox(memberData, options),
            map(this.memberVote)(memberVotes),
          ]),
        ]),
      ]);
    }
  });
