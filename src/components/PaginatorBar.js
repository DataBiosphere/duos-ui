import { Component } from 'react';
import Pagination from 'react-paginating';
import { div, hh, h, button, span, select, option } from 'react-hyperscript-helpers';
import _ from 'lodash/fp';
import './PaginatorBar.css';

const paginatorButton = (props, label) => button(_.merge({ className: 'pagination-btn' }, props), label);

export const PaginatorBar = hh(class PaginatorBar extends Component {

  constructor(props) {
    super(props);

    this.changeLimit = this.changeLimit.bind(this);
    this.state = {
      limit: this.props.limit ? this.props.limit : 5,
      pageCount: this.props.pageCount ? this.props.pageCount : 5
    };
  }

  changeLimit(e) {
    const target = e.target;
    const value = target.value;
    this.setState(prev => {
      prev.limit = value;
      return prev;
    }, () => { this.props.changeHandler(this.state.limit); });
  }

  firstItem(currentPage, total) {
    return total === 0 ? total : (currentPage * this.state.limit) - this.state.limit + 1;
  }


  lastItem(hasNextPage) {
    return hasNextPage ? this.props.currentPage * this.state.limit : this.props.total;
  }

  render() {

    return (

      h(Pagination, {
        total: this.props.total,  // Total results
        limit: parseInt(this.state.limit, 10), // Number of results per page
        pageCount: this.state.pageCount, // How many pages number you want to display in pagination zone.
        currentPage: this.props.currentPage // Current page number
      }, [
        // eslint-disable-next-line no-unused-vars
        ({ pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps }) =>
          div({ className: 'controls-wrapper' }, [

            div({className: 'show-results-wrapper'}, [
              'Showing ', this.firstItem(currentPage, this.props.total), ' to ', this.lastItem(hasNextPage), ' of ', this.props.total, ' entries'
            ]),

            div({ className: 'pagination-wrapper' }, [

              paginatorButton(
                _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                  getPageItemProps({ pageValue: previousPage, onPageChange: this.props.onPageChange })),
                [
                  span({ className: 'glyphicon glyphicon-menu-left arrow pull-left', 'aria-hidden': 'true' }),
                  span({className: 'button-label'},['Previous'])
                ]
              ),

              _.map(num => paginatorButton(
                _.merge({
                  key: num,
                  className: 'pagination-btn ' + (currentPage === num ? 'active' : '')
                },
                getPageItemProps({ pageValue: num, onPageChange: this.props.onPageChange })),
                num), pages
              ),

              paginatorButton(
                _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                  getPageItemProps({ pageValue: nextPage, onPageChange: this.props.onPageChange })),
                [
                  span({ className: 'glyphicon glyphicon-menu-right arrow pull-right', 'aria-hidden': 'true' }),
                  span({className: 'button-label'},['Next'])
                ]
              ),
            ]),

            div({ className: 'select-wrapper' }, [
              select({ className: 'select', value: this.state.limit, onChange: this.changeLimit }, [
                option({ value: 5 }, ['  5']),
                option({ value: 10 }, [' 10']),
                option({ value: 20 }, [' 20']),
                option({ value: 50 }, [' 50']),
                option({ value: 100 }, ['100']),
              ]),

              div({ className: 'select-label' }, ['items per page'])
            ]),
          ])
      ])
    );
  }
});


