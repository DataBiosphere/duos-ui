import React from 'react';
import { useRef } from 'react';
import { Styles } from '../libs/theme';
import { defaultTo } from 'lodash/fp';

export default function SearchBar(props) {
  const { handleSearchChange } = props;
  const searchTerms = useRef('');

  const button = props.button ? props.button : <div />;

  const style = {
    width: '100%',
    border: '1px solid #cecece',
    backgroundColor: '#f3f6f7',
    borderRadius: '5px',
    height: '4rem',
    paddingLeft: '2%',
    fontFamily: 'Montserrat',
    fontSize: '1.5rem',
    ...props.style
  };

  return (
    <div className="right-header-section" style={Styles.RIGHT_HEADER_SECTION}>
      <input
        data-cy="search-bar"
        type="text"
        placeholder="Enter search terms"
        style={style}
        onChange={() => handleSearchChange(props.searchRef ? defaultTo('')(props.searchRef.current.value) : searchTerms)}
        ref={props.searchRef || searchTerms}
      />
      {button}
    </div>
  );
}
