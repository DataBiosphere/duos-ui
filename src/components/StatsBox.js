import { Component } from 'react';
import { div, button, span, hh, h, hr, h4, i } from 'react-hyperscript-helpers';
import { Chart } from "react-google-charts";

export const StatsBox = hh(class StatsBox extends Component {
  chartOptions = {
    'accessTotal': {
      pieHole: 0.4,
      is3D: true,
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
    'accessReviewed': {
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
    'dulTotal': {
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
    'dulReviewed': {
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
    'RPTotal': {
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
    'RPReviewed': {
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
    'VaultReviewed': {
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
    'Agreement': {
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
    }
  };

  componentDidMount() {
    console.log('componentDidMount');
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log('componentDidUpdate', prevProps, prevState, snapshot);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  render() {

    let options = this.props.options;
    let data = this.props.data;
    let subtitle = this.props.subtitle;
    let clickHandler = this.clickConsumer();

    let total = 0;
    data.forEach((element, index) => {
      if (index > 0) {
        total += element[1];
      }
    });

    let buttonTag = null;

    if (this.props.clickHandler !== undefined) {
      buttonTag = div({ className: "no-padding f-right display-inline-block" },
        [
          button({ onClick: this.props.clickHandler, className: "btn vote-reminder access-color" },
            [
              this.props.buttonLabel
            ]),
        ])
    }

    const iconName = this.props.iconName !== undefined ? this.props.iconName : "glyphicon-chevron-left";
    return (
      div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 jumbotron box-vote-stats" },
        [
          h4({ className: "cm-results-subtitle display-inline-block", id: subtitle },
            [
              subtitle
            ]),
          buttonTag,
          hr({ className: "box-separator-white  col-lg-12 col-md-12 col-sm-12 col-xs-12" }),
          div({ className: "row col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
            div({},
              [
                h(Chart, {
                  chartType: "PieChart",
                  // width: "100%",
                  // height: "400px",
                  data: data,
                  options: this.chartOptions[options],

                })
              ]),
            h4(
              {
                className: "cm-results-amount"
              },
              [
                i({ className: "glyphicon " + iconName }),
                "Amount of cases: ",
                span({ className: "dul-color" }, [total])
              ]
            )
          ])
        ]
      )
    );
  }

  clickConsumer() {
  }
});
