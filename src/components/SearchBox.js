import React, { Component } from 'react';
import { div, hh, input, i, a } from 'react-hyperscript-helpers';

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
      div({ className: "search-text" }, [
        i({ className: "glyphicon glyphicon-search " + this.props.color + "-color" }),
        input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", onChange: this.changeHandler, ref: this.myRef }),
        a({ onClick: this.reset, style: { "cursor": "pointer" } }, [
          i({ className: "glyphicon glyphicon-erase " + this.props.color + "-color", })
        ])
      ])
    );
  }
});
