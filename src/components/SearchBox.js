import React, { Component } from 'react';
import { div, hh, input, i, a } from 'react-hyperscript-helpers';
import './SearchBox.css';

export const SearchBox = hh(class SearchBox extends Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  changeHandler = (e) => {
    let value = e.target.value;
    this.props.searchHandler(value);
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
        a({ onClick: this.reset, className: "search-box-reset" }, [
          i({ className: "glyphicon glyphicon-remove-circle dismiss-color" })
        ])
      ])
    );
  }
});
