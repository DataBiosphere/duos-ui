import { Component } from 'react';
import { div, hh, input, i } from 'react-hyperscript-helpers';

export const SearchBox = hh(class SearchBox extends Component {

  changeHandler = (e) => {
    let value = e.target.value;
    this.props.searchHandler(value);
  }

  render() {
    return (
      div({ className: "search-text" }, [
        i({ className: "glyphicon glyphicon-search dul-color" }),
        input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", onChange: this.changeHandler }),
      ])
    );
  }
});
