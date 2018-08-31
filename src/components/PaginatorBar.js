import React, { Component } from 'react';
import Pagination from 'react-paginating';
import { div, hh, li, ul, h, i, a, input, button, hr, option, span, select } from 'react-hyperscript-helpers';
import _ from 'lodash/fp'
import './PaginatorBar.css';

const paginatorButton = (props, label) => button(_.merge({
  className: "pagination-btn"
  // style: {
  //   margin: '0 2px', padding: '0.25rem 0.5rem',
  //   border: '1px solid #ccc', 
  //   borderRadius: 3,
  //   color: props.disabled ? '#fdce09' : '#00f', 
  //   backgroundColor: 'white',
  //   cursor: props.disabled ? 'not-allowed' : 'pointer'
  // }
}, props), label);

export const PaginatorBar = hh(class PaginatorBar extends Component {

  render() {

    return (

      h(Pagination, {
        total: this.props.total,  // Total results
        limit: this.props.limit, // Number of results per page
        pageCount: this.props.pageCount, // How many pages number you want to display in pagination zone.
        currentPage: this.props.currentPage // Current page number
      }, [
          ({ pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps }) => div(
            { className: 'absolute-center' }, [

              paginatorButton(_.merge({ disabled: currentPage === 1 },
                getPageItemProps({ pageValue: 1, onPageChange: this.props.onPageChange })),
                // ['First']
                [
                  span({ className: "glyphicon glyphicon-fast-backward", "aria-hidden": "true" })
                ]
              ),

              paginatorButton(
                _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                  getPageItemProps({ pageValue: previousPage, onPageChange: this.props.onPageChange })),
                [
                  span({ className: "glyphicon glyphicon-chevron-left", "aria-hidden": "true" })
                ]
              ),

              _.map(num => paginatorButton(
                _.merge({
                  key: num,
                  style: {
                    minWidth: '2rem',
                    backgroundColor: currentPage === num ? '#0000ff' : undefined,
                    color: currentPage === num ? '#000000' : '#0000ff',
                    fontWeight: currentPage === num ? '900' : 'normal',
                    border: currentPage === num ? '#0000ff' : undefined
                  }
                },
                  getPageItemProps({ pageValue: num, onPageChange: this.props.onPageChange })),
                num), pages
              ),

              paginatorButton(
                _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                  getPageItemProps({ pageValue: nextPage, onPageChange: this.props.onPageChange })),
                [
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" })
                ]
              ),

              paginatorButton(
                _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
                  getPageItemProps({ pageValue: totalPages, onPageChange: this.props.onPageChange })),
                // ['Last']
                [
                  span({ className: "glyphicon glyphicon-fast-forward", "aria-hidden": "true" })
                ]
              ),
            ])
        ])
    );
  }
});
