import { Component } from 'react';
import Pagination from 'react-paginating';
import { div, hh, h, button, span } from 'react-hyperscript-helpers';
import Select from 'react-select';
import _ from 'lodash/fp'
import './PaginatorBar.css';

const paginatorButton = (props, label) => button(_.merge({ className: "pagination-btn" }, props), label);

const options = [
  { label: '  5', value: 5, clearableValue: false },
  { label: ' 10', value: 10, clearableValue: false },
  { label: ' 20', value: 20, clearableValue: false },
  { label: ' 50', value: 50, clearableValue: false },
  { label: '100', value: 100, clearableValue: false },
];

export const PaginatorBar = hh(class PaginatorBar extends Component {

  limit = 0;

  constructor(props) {
    super(props);
    this.state = {
      limit: this.props.limit
    }
  }

  changeLimit = (data) => {
    this.setState(prev => {
      prev.limit = data.value;
      return prev;
    });
    this.props.changeHandler(data.value);
  }

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
                  span({ className: "glyphicon glyphicon-menu-left double-arrow", "aria-hidden": "true" }),
                  span({ className: "glyphicon glyphicon-menu-left double-arrow", "aria-hidden": "true" })
                ]
              ),

              paginatorButton(
                _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                  getPageItemProps({ pageValue: previousPage, onPageChange: this.props.onPageChange })),
                [
                  span({ className: "glyphicon glyphicon-menu-left arrow", "aria-hidden": "true" })
                ]
              ),

              _.map(num => paginatorButton(
                _.merge({
                  key: num,
                  className: "pagination-btn " + (currentPage === num ? "active" : "")
                },
                  getPageItemProps({ pageValue: num, onPageChange: this.props.onPageChange })),
                num), pages
              ),

              paginatorButton(
                _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                  getPageItemProps({ pageValue: nextPage, onPageChange: this.props.onPageChange })),
                [
                  span({ className: "glyphicon glyphicon-menu-right arrow", "aria-hidden": "true" })
                ]
              ),

              paginatorButton(
                _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
                  getPageItemProps({ pageValue: totalPages, onPageChange: this.props.onPageChange })),
                // ['Last']
                [
                  span({ className: "glyphicon glyphicon-menu-right double-arrow", "aria-hidden": "true" }),
                  span({ className: "glyphicon glyphicon-menu-right double-arrow", "aria-hidden": "true" })
                ]
              ),

              h(Select, {
                clearable: false,
                multi: false,
                placeholder: '',
                value: this.state.limit,
                defaultValue: options[0],
                onChange: data => this.changeLimit(data),
                options: options,

              })
            ])
        ])
    );
  }
});

