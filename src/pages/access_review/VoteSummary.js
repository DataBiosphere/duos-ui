import React from 'react';
import {div, h, hh} from 'react-hyperscript-helpers';
import {Theme} from '../../libs/theme';
import {Chart} from 'react-google-charts';
import * as fp from 'lodash/fp';
import * as moment from 'moment';

const STYLE = {
  color: Theme.palette.primary,
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
  fontWeight: Theme.font.weight.semibold,
  fontFamily: 'Montserrat',
  backgroundColor: Theme.palette.background.secondary,
  padding: 16,
  borderRadius: '0 9px 9px 0',
};

const HEADER_STYLE = {
  fontSize: Theme.font.size.subheader,
  lineHeight: Theme.font.leading.regular,
  textTransform: 'uppercase',
  margin: '16px 0px',
  opacity: '70%',
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
          height: 150,
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
      const positiveVotes = fp.filter(['vote', true])(votes).length;
      const negativeVotes = fp.filter(['vote', false])(votes).length;
      const pendingVotes = fp.filter(['vote', null])(votes).length;
      return [
        ['Results', 'Votes'],
        ['Yes', positiveVotes],
        ['No', negativeVotes],
        ['Pending', pendingVotes],
      ];
    };

    memberVote = (vote) => {
      const voteString = fp.isNull(vote.vote.vote) ? 'Pending' : vote.vote.vote ? 'Yes' : 'No';
      const createDateString = fp.isNull(vote.vote.createDate) ? '' : moment(vote.vote.createDate).format('MM/DD/YY');
      return div({
        style: {
          borderRadius: 9,
          backgroundColor: '#DFE8EE',
          height: 150,
          width: 275,
          padding: 0,
          margin: '.5rem'
        },
      }, [
        div({style: {fontSize: Theme.font.size.small, fontWeight: Theme.font.weight.semibold, padding: '1rem'}}, [vote.displayName]),
        div({style: {margin: 0, padding: 0, borderTop: '1px solid #BABEC1', height: 0}}, []),
        div({style: {fontSize: Theme.font.size.small, fontWeight: Theme.font.weight.semibold, padding: '1rem'}}, [
          div({style: {display: 'flex', flexWrap: 'wrap'}}, [
            div({style:{padding: '0 1rem 1rem 0'}}, ['VOTE: ']),
            div({style:{padding: '0 1rem 1rem 0', fontWeight: Theme.font.weight.regular, minWidth: '7rem'}}, [voteString]),
            div({style:{padding: '0 1rem 1rem 0'}}, ['DATE: ']),
            div({style:{fontWeight: Theme.font.weight.regular}}, [createDateString]),
          ]),
          div({padding: '0 1rem 1rem 0'}, ['RATIONALE: ']),
          div({style:{fontWeight: Theme.font.weight.regular}}, [vote.vote.rationale]),
        ]),
      ]);
    };

    render() {
      const data = this.voteChart(fp.map('vote')(this.props.votes));
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
          div({style: HEADER_STYLE}, ['How committee members voted:']),
          div({
            style: {
              display: 'flex',
              flexWrap: 'wrap',
            },
          },
          [
            this.voteResultsBox(data, options),
            fp.map(this.memberVote)(this.props.votes),
          ])
        ]),
      ])
      ;
    }

  });
