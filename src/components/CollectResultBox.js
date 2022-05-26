import { PureComponent } from 'react';
import { div, hh, label, h4, h, hr, span } from 'react-hyperscript-helpers';
import { Chart } from 'react-google-charts';
import * as Utils from '../libs/utils';
export const CollectResultBox = hh(class CollectResultBox extends PureComponent {

  static defaultProps = {
    chartData: {
      Results: '',
      Yes: 0,
      No: 0,
      Pending: 0
    }
  };

  chartOptions = {
    'dul': {
      pieHole: 0.4,
      pieSliceTextStyle: {
        color: 'white',
        fontSize: 16
      },
      pieSliceText: 'none',
      pieSliceBorderColor: 'transparent',
      backgroundColor: 'transparent',
      chartArea: {
        left: 0,
        top: 10,
        right: 0,
        bottom: 10,
        width: '100%',
        height: '85%'
      },
      height: 138,
      slices: {
        0: { color: '#C16B0C' },
        1: { color: '#D1B6A1' },
        2: { color: '#FFFFFF' }
      },
      legend: {
        position: 'right',
        textStyle: {
          fontName: 'Roboto',
          color: '#333333',
          bold: true,
          fontSize: 15
        },
        alignment: 'start'
      },
      tooltip: {
        textStyle: {
          fontName: 'Roboto',
          color: '#333333',
          fontSize: 14
        }
      }
    },
    'access': {
      pieHole: 0.4,
      is3D: false,
      pieSliceTextStyle: {
        color: 'white',
        fontSize: 16
      },
      pieSliceText: 'none',
      pieSliceBorderColor: 'transparent',
      backgroundColor: 'transparent',
      chartArea: {
        left: 0,
        top: 10,
        right: 0,
        bottom: 10,
        width: '100%',
        height: '85%'
      },
      height: 138,
      slices: {
        0: { color: '#603B9B' },
        1: { color: '#AC9EC6' },
        2: { color: '#FFFFFF' }
      },
      legend: {
        position: 'right',
        textStyle: {
          fontName: 'Roboto',
          color: '#333333',
          bold: true,
          fontSize: 15
        },
        alignment: 'start'
      },
      tooltip: {
        textStyle: {
          fontName: 'Roboto',
          color: '#333333',
          fontSize: 14
        }
      }
    },
  };

  render() {

    let vote = null;
    if (this.props.vote === true || this.props.vote === 'true' || this.props.vote === '1') vote = true;
    if (this.props.vote === false || this.props.vote === 'false' || this.props.vote === '0') vote = false;

    return (
      div({ className: 'jumbotron box-vote-results ' + this.props.class }, [

        div({ isRendered: this.props.type === undefined, className: 'row' }, [
          div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
            h4({ className: 'box-vote-title ' + this.props.color + '-color' }, [this.props.title]),
            hr({ className: 'box-separator' }),
            div({ className: 'row results-box' }, [
              label({ className: 'col-lg-3 col-md-3 col-sm-4 col-xs-4 control-label vote-label ' + this.props.color + '-color' }, ['Vote: ']),
              div({ id: 'lbl_result' + this.props.id, className: 'col-lg-3 col-md-3 col-sm-8 col-xs-8 vote-label bold' }, [
                span({ isRendered: vote === true }, ['YES']),
                span({ isRendered: vote === false }, ['NO']),
                span({ isRendered: vote === null }, []),
              ]),
              label({ className: 'col-lg-2 col-md-2 col-sm-4 col-xs-4 control-label vote-label ' + this.props.color + '-color' }, ['Date: ']),

              div({ id: 'lbl_date' + this.props.id, className: 'col-lg-4 col-md-4 col-sm-8 col-xs-8 vote-label' }, [
                Utils.formatDate(this.props.voteDate)
              ]),
              span({ isRendered: vote === true }, [
                label({ className: 'col-lg-3 col-md-3 col-sm-4 col-xs-4 control-label vote-label ' + this.props.color + '-color' }, ['Comments:']),
              ]),
              span({ isRendered: vote === false || vote === null }, [
                label({ id: 'lbl_rationale' + this.props.id, className: 'col-lg-3 col-md-3 col-sm-4 col-xs-4 control-label vote-label ' + this.props.color + '-color' }, ['Rationale:']),
              ]),
              div({ className: 'col-lg-9 col-md-9 col-sm-8 col-xs-8 vote-label' }, [
                span({ isRendered: this.props.rationale !== null }, [this.props.rationale]),
                span({ isRendered: this.props.rationale === null }, ['---']),
              ]),
            ]),
          ]),
          div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6 no-padding' }, [
            h(Chart, {
              id: 'chart_' + this.props.id,
              chartType: 'PieChart',
              data: this.props.chartData,
              options: this.chartOptions[this.props.color],
              className: 'result-chart',
              loader: 'Loading...',
              style: { 'marginTop': '10px', 'marginBottom': '10px', }
            })
          ]),
        ]),

        div({ isRendered: this.props.type === 'stats' }, [
          h4({ className: 'box-vote-title ' + this.props.color + '-color' }, [this.props.title]),
          hr({ className: 'box-separator' }),
          h(Chart, {
            id: 'chart_' + this.props.id,
            chartType: 'PieChart',
            data: this.props.chartData,
            options: this.chartOptions[this.props.color],
            className: 'result-chart',
            loader: 'Loading...',
            style: { 'marginTop': '10px' }
          })
        ]),

        div({ isRendered: this.props.type === 'records' }, [
          h4({ className: 'box-vote-title italic ' + this.props.color + '-color' }, [this.props.title]),
          hr({ className: 'box-separator' }),
          div({ className: 'results-box' }, [
            div({ className: 'row' }, [
              label({ className: 'col-lg-3 col-md-3 col-sm-3 col-xs-3 control-label vote-label ' + this.props.color + '-color' }, ['Vote: ']),
              div({ id: 'lbl_result' + this.props.id, className: 'col-lg-2 col-md-2 col-sm-2 col-xs-2 vote-label bold' }, [
                span({ isRendered: vote === true }, ['YES']),
                span({ isRendered: vote === false }, ['NO']),
                span({ isRendered: vote === null }, []),
              ]),
              label({ className: 'col-lg-3 col-md-3 col-sm-3 col-xs-3 control-label vote-label ' + this.props.color + '-color' }, ['Date: ']),

              div({ id: 'lbl_date' + this.props.id, className: 'col-lg-4 col-md-4 col-sm-8 col-xs-8 vote-label' }, [
                Utils.formatDate(this.props.voteDate)
              ]),
            ]),
            div({ className: 'row' }, [
              label({ className: 'col-lg-3 col-md-3 col-sm-3 col-xs-3 control-label vote-label ' + this.props.color + '-color' }, ['Comments:']),
              div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-9 vote-label' }, [
                span({ isRendered: vote !== null }, [this.props.rationale]),
                span({ isRendered: vote === null }, ['---']),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
});
