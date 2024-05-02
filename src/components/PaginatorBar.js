import React, {useState} from 'react';
import Pagination from 'react-paginating';
import _ from 'lodash/fp';
import './PaginatorBar.css';

const PaginatorButton = ({ props, label }) => (
  <button className="pagination-btn" {...props}>
    {label}
  </button>
);

export const PaginatorBar = (props) => {
  const [limit, setLimit] = useState(props.limit ? props.limit : 5);
  const [pageCount] = useState(props.pageCount ? props.pageCount : 5);

  const changeLimit = (e) => {
    const value = e.target.value;
    setLimit(value);
    props.changeHandler(value);
  };

  const firstItem = (currentPage, total) => {
    return total === 0 ? total : (currentPage * limit) - limit + 1;
  };

  const lastItem = (hasNextPage) => {
    return hasNextPage ? props.currentPage * limit : props.total;
  };

  return (
    <Pagination
      total={props.total} //Total results
      limit={parseInt(limit, 10)} // Number of results per page
      pageCount={pageCount} // How many pages number you want to display in pagination zone.
      currentPage={props.currentPage} // Current page number
    >
      {/* eslint-disable-next-line no-unused-vars */}
      {({ pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps }) => (
        <div className="controls-wrapper">
          <div className="show-results-wrapper">
            Showing {firstItem(currentPage, props.total)} to {lastItem(hasNextPage)} of {props.total} entries
          </div>
          <div className="pagination-wrapper">
            <PaginatorButton
              props={{ disabled: !hasPreviousPage, style: { marginRight: '1rem' }, ...getPageItemProps({ pageValue: previousPage, onPageChange: props.onPageChange }) }}
              label={
                <>
                  <span className="glyphicon glyphicon-menu-left arrow pull-left" aria-hidden="true" />
                  <span className="button-label">Previous</span>
                </>
              }
            />
            {_.map(
              num => (
                <PaginatorButton
                  key={num}
                  props={{ className: `pagination-btn ${currentPage === num ? 'active' : ''}`, ...getPageItemProps({ pageValue: num, onPageChange: props.onPageChange }) }}
                  label={num}
                />
              ),
              pages
            )}
            <PaginatorButton
              props={{ disabled: !hasNextPage, style: { marginLeft: '1rem' }, ...getPageItemProps({ pageValue: nextPage, onPageChange: props.onPageChange }) }}
              label={
                <>
                  <span className="glyphicon glyphicon-menu-right arrow pull-right" aria-hidden="true" />
                  <span className="button-label">Next</span>
                </>
              }
            />
          </div>
          <div className="select-wrapper">
            <select className="select" value={limit} onChange={changeLimit}>
              {[5, 10, 20, 50, 100].map(optionValue => (
                <option key={optionValue} value={optionValue}>{optionValue}</option>
              ))}
            </select>
            <div className="select-label">items per page</div>
          </div>
        </div>
      )}
    </Pagination>
  );
};

