import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { input } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import './SearchBox.css';

export class SearchBox extends Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  changeHandler = (e) => {
    let value = e.target.value;
    this.props.searchHandler(value);
    this.props.pageHandler(1);
  };

  reset = () => {
    this.myRef.current.value = '';
    this.props.searchHandler('');
  };

  componentDidMount() {
    ReactTooltip.rebuild();
  }

  render() {
    return (
      input({
        type: 'text',
        placeholder: 'Enter search terms',
        onChange: this.changeHandler,
        ref: this.myRef,
        style: {
          width: '100%',
          border: '1px solid #cecece',
          backgroundColor: '#f3f6f7',
          borderRadius: '5px',
          height: '4rem',
          paddingLeft: '2%',
          fontFamily: 'Montserrat'
        }
      })
    );
  }
}

SearchBox.propTypes = {
  searchHandler: PropTypes.func,
  pageHandler: PropTypes.func,
};

SearchBox.defaultProps = {
  searchHandler: () => { },
  pageHandler: () => { }
};
