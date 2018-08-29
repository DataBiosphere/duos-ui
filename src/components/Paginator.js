import  React from 'react';
import Pagination from 'react-paginating';
import { div, li, ul, h, i, a, input, button, hr, option, span, select } from 'react-hyperscript-helpers';
import { Consent } from "../libs/ajax";
import _ from 'lodash/fp'

const limit = 10;
const pageCount = 10;

const paginatorButton = (props, label) => button(_.merge({
  style: {
    margin: '0 2px', padding: '0.25rem 0.5rem',
    border: '1px solid #ccc', borderRadius: 3,
    color: props.disabled ? '#fdce09' : '#00f', backgroundColor: 'white',
    cursor: props.disabled ? 'not-allowed' : 'pointer'
  }
}, props), label);

export const paginator = function(props) {
  const {
    filteredDataLength, pageNumber, setPageNumber, setItemsPerPage,
    itemsPerPage, itemsPerPageOptions = [10, 25, 50, 100]
  } = props

  return h(Pagination, {
    total: filteredDataLength,
    limit: itemsPerPage,
    pageCount: 5,
    currentPage: pageNumber
  }, [
    ({ pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps }) => h(React.Fragment,
      [
        div({ style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '1rem' } }, [
          `${(pageNumber - 1) * itemsPerPage + 1} - ${_.min([filteredDataLength, pageNumber * itemsPerPage])} of ${filteredDataLength}`,
          div({ style: { display: 'inline-flex', padding: '0 1rem' } }, [

            paginatorButton(
              _.merge({ disabled: currentPage === 1, style: { marginRight: '0.5rem' } },
                getPageItemProps({ pageValue: 1, onPageChange: setPageNumber })),
              ['<<']
            ),

            paginatorButton(
              _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                getPageItemProps({ pageValue: previousPage, onPageChange: setPageNumber })),
              ['<']
            ),

            _.map(num => paginatorButton(
              _.merge({
                  key: num,
                  style: {
                    minWidth: '2rem',
                    backgroundColor: currentPage === num ? '#0000ff' : undefined,
                    color: currentPage === num ? '#ffffff' : '#0000ff',
                    border: currentPage === num ? '#0000ff' : undefined
                  }
                },
                getPageItemProps({ pageValue: num, onPageChange: setPageNumber })),
              num), pages
            ),

            paginatorButton(
              _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                getPageItemProps({ pageValue: nextPage, onPageChange: setPageNumber })),
              ['>']
            ),

            paginatorButton(
              _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
                getPageItemProps({ pageValue: totalPages, onPageChange: setPageNumber })),
              ['>>']
            )
          ]),

          setItemsPerPage && h(React.Fragment, [
            'Items per page:',
            select({
                style: { marginLeft: '0.5rem' },
                onChange: e => setItemsPerPage(parseInt(e.target.value, 10)),
                value: itemsPerPage
              },
              _.map(i => option({ value: i }, i),
                itemsPerPageOptions))
          ])
        ])
      ]
    )
  ])
};

class Paginator extends React.Component {

  constructor(props) {
    super(props);
    console.log("Paginator constructor ", props);
    this.state = {
      currentPage: 1,
      total: 1,
      electionsList: {
        dul: []
      },
    },
    this.handlePageChange= this.handlePageChange.bind(this);
  };

  componentWillMount() {
    this.getConsentManage();
  }

  handlePageChange = page => {
    this.setState({
      currentPage: page
    });
  };

  async getConsentManage() {
    Consent.getConsentManage().then(data => {
      const regex = new RegExp('-', 'g');
      data.map(election => {
        let str = election.consentName;
        str = str.replace(regex, ' ');
        election.ct = election.consentName + ' ' + election.version;
        election.cts = str + ' ' + election.version;
        return election;
      });
      this.setState({
        electionsList: {
          dul: data
        }
      });
    });
  }

  render() {
    const {currentPage} = this.state;
    return (
      <a>A</a>
    )
      // div({className: "container container-wide"}, [
      //   ul({}, [
      //
      //     this.state.electionsList.dul.slice((currentPage -1) * 10, currentPage * 10).map(item => li({}, item.consentId))
      //   ])

          // paginator({
          //   filteredDataLength: totalRowCount,
          //   pageNumber,
          //   setPageNumber: v => this.setState({ pageNumber: v }, resetScroll),
          //   itemsPerPage,
          //   setItemsPerPage: v => this.setState({ itemsPerPage: v, pageNumber: 1 }, resetScroll)
          // })

      //   h(Pagination, {
      //     total: this.state.electionsList.dul.length,  // Total results
      //     limit: limit, // Number of results per page
      //     pageCount: pageCount, // How many pages number you want to display in pagination zone.
      //     currentPage: currentPage // Current page number
      //   }, [
      //     ({pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps}) => h(React.Fragment, [
      //       div({}, [
      //       ]),
      //       // button({onClick: this.handlePageChange({pageValue: 1})}, [a("HEY")]),
      //       paginatorButton(_.merge({ disabled: currentPage === 1},
      //         getPageItemProps({ pageValue: 1, onPageChange: this.handlePageChange})),
      //         ['first']),
      //
      //       paginatorButton(
      //         _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
      //           getPageItemProps({ pageValue: previousPage, onPageChange: this.handlePageChange})),
      //         ['<']
      //       ),
      //
      //       _.map(num => paginatorButton(
      //         _.merge({
      //             key: num,
      //             style: {
      //               minWidth: '2rem',
      //               backgroundColor: currentPage === num ? '#0000ff' : undefined,
      //               color: currentPage === num ? '#ffffff' : '#0000ff',
      //               border: currentPage === num ? '#0000ff' : undefined
      //             }
      //           },
      //           getPageItemProps({ pageValue: num, onPageChange: this.handlePageChange})),
      //         num), pages
      //       ),
      //       paginatorButton(
      //         _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
      //           getPageItemProps({ pageValue: nextPage, onPageChange: this.handlePageChange})),
      //         ['>']
      //       ),
      //       paginatorButton(
      //         _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
      //           getPageItemProps({ pageValue: totalPages, onPageChange: this.handlePageChange})),
      //         ['Last']
      //       ),
      //     ])
      //   ])
      // ])
    // )
  }}

  export default Paginator;



/*
paginatorButton(_.merge({ disabled: currentPage === 1},
              getPageItemProps({ pageValue: 1, onPageChange: this.handlePageChange})),
              ['first']),

            paginatorButton(
              _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                getPageItemProps({ pageValue: previousPage, onPageChange: this.handlePageChange})),
              ['<']
            ),

            _.map(num => paginatorButton(
              _.merge({
                  key: num,
                  style: {
                    minWidth: '2rem',
                    backgroundColor: currentPage === num ? '#0000ff' : undefined,
                    color: currentPage === num ? '#ffffff' : '#0000ff',
                    border: currentPage === num ? '#0000ff' : undefined
                  }
                },
                getPageItemProps({ pageValue: num, onPageChange: this.handlePageChange})),
              num), pages
            ),
            paginatorButton(
              _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                getPageItemProps({ pageValue: nextPage, onPageChange: this.handlePageChange})),
              ['>']
            ),
            paginatorButton(
              _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
                getPageItemProps({ pageValue: totalPages, onPageChange: this.handlePageChange})),
              ['Last']
            ),
* */



/*
        paginator({
          filteredDataLength: totalRowCount,
          pageNumber,
          setPageNumber: v => this.setState({ pageNumber: v }, resetScroll),
          itemsPerPage,
          setItemsPerPage: v => this.setState({ itemsPerPage: v, pageNumber: 1 }, resetScroll)
        })
* */