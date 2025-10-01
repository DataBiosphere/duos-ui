import React, { useRef } from 'react'
import { Styles } from '../libs/theme'
import { defaultTo } from 'lodash/fp'
import PropTypes from 'prop-types'

export default function SearchBar(props) {
  const { handleSearchChange, placeholder = 'Enter search terms' } = props
  const searchTerms = useRef('')

  const button = props.button ? props.button : <div />

  const style = {
    width: '100%',
    border: '1px solid #cecece',
    backgroundColor: '#f3f6f7',
    borderRadius: '5px',
    height: '4rem',
    paddingLeft: '2%',
    fontFamily: 'Montserrat',
    fontSize: '1.5rem',
    ...props.style,
  }

  SearchBar.propTypes = {
    handleSearchChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    button: PropTypes.node,
    style: PropTypes.object,
    searchRef: PropTypes.object,
  }

  return (
    <div className="right-header-section" style={Styles.RIGHT_HEADER_SECTION}>
      <input
        data-cy="search-bar"
        type="text"
        placeholder={placeholder}
        style={style}
        onChange={() => handleSearchChange(props.searchRef ? defaultTo('')(props.searchRef.current.value) : searchTerms)}
        ref={props.searchRef || searchTerms}
      />
      {button}
    </div>
  )
}
