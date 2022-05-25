import { PureComponent } from 'react';
import { div, button, span, hh, h, hr, h4 } from 'react-hyperscript-helpers';
import { Chart } from 'react-google-charts';

export const StatsBox = hh(class StatsBox extends PureComponent {

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
        1: { color: '#D1B6A1' }
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
        1: { color: '#AC9EC6' }
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

    const { id, data, options, clickHandler, buttonLabel, subtitle } = this.props;

    let total = 0;
    data.forEach((element, index) => {
      if (index > 0) {
        total += element[1];
      }
    });

    let buttonTag = null;

    if (clickHandler !== undefined) {
      buttonTag = div({ className: 'no-padding f-right display-inline-block' }, [
        button({ id: id + '_btnDownload', onClick: clickHandler, className: 'btn-secondary btn-reminder ' + options + '-color' }, [buttonLabel]),
      ]);
    }

    return (
      div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 jumbotron box-vote-stats' }, [
        h4({ id: id + '_title', className: 'cm-results-subtitle' }, [subtitle]),
        buttonTag,
        hr({ className: 'box-separator-white' }),
        div({ className: 'row no-margin', style: { 'marginTop': '10px' } }, [
          h(Chart, {
            chartType: 'PieChart',
            data: data,
            loader: 'Loading...',
            options: this.chartOptions[options],
          })
        ]),
        h4({ className: 'cm-results-amount' }, [
          'Amount of cases: ',
          span({ className: 'bold ' + options + '-color' }, [total])
        ]
        )
      ])
    );
  }
});
