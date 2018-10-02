import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { div, hh, h, input, i, a } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import './SearchBox.css';

export const SearchBox = hh(class SearchBox extends Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    console.log(props);
  }

  changeHandler = (e) => {
    let value = e.target.value;
    this.props.searchHandler(value);
    this.props.pageHandler(1);
  }

  reset = (e) => {
    this.myRef.current.value = '';
    this.props.searchHandler('');
  }

  render() {
    return (
      div({ className: "search-box" }, [
        i({ className: "glyphicon glyphicon-search " + this.props.color + "-color" }),
        input({ id: "txt_search_" + this.props.id, type: "search", className: "form-control", placeholder: "Enter search term...", onChange: this.changeHandler, ref: this.myRef }),
        a({ onClick: this.reset, className: "search-box-reset", "data-tip": "", "data-for": "tip_clearSearch" }, [
          i({ className: "glyphicon glyphicon-remove-circle dismiss-color" })
        ]),
        h(ReactTooltip, { id: "tip_clearSearch", place: 'top', effect: 'solid', className: 'tooltip-wrapper' }, ["Clear Search"])
      ])
    );
  }
}
);

SearchBox.propTypes = {
  searchHandler: PropTypes.func,
  pageHandler: PropTypes.func,
}

SearchBox.defaultProps = {
  searchHandler: (query) => (console.log('search: ' + query)),
  pageHandler: (page) => { console.log('go to page ' + page); }
}

