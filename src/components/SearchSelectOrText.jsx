import React from 'react';
import { useState, useEffect, useRef } from 'react';
import {isEqual} from 'lodash';
import {find} from 'lodash/fp';

import './SearchSelect.css';

export const SearchSelectOrText = (props) => {
  const { onPresetSelection, onManualSelection, onOpen, placeholder, options, searchPlaceholder, id, label, disabled, errored, onBlur} = props;
  const [currentDisplay, setCurrentDisplay] = useState(placeholder || '');

  const [currentSelection, setCurrentSelection] = useState(props.value);
  const [fullList, setFullList] = useState(props.options);
  const [filteredList, setFilteredList] = useState(props.options);

  const searchTerms = useRef('');

  useEffect(() => {
    if (props.value) {
      setCurrentSelection(props.value);
      const item = find(i => i.key === props.value)(props.options);
      if (item) {
        setCurrentDisplay(item.displayText);
      }
    } else if (props.freetextValue) {
      setCurrentDisplay(props.freetextValue);
    }

    if (!isEqual(props.options, fullList)) {
      setFullList(props.options);
      setFilteredList(props.options);
    }
  }, [props.value, props.freetextValue, props.options, fullList]);

  const setPresetDisplay = (selection) => {
    const item = options.filter(i => i.key === selection);
    if (item && item.length) {
      setCurrentDisplay(item[0].displayText);
    }
  };

  const setManualDisplay = (text) => {
    setCurrentDisplay(text);
  };

  const select = (selection) => {
    setPresetDisplay(selection);
    onPresetSelection(selection);
  };


  const selectManual = (text) => {
    // check and see if the manually entered item is an option
    const presetOption = options.filter(i => i.key === text);
    if (presetOption.length != 0) {
      select(presetOption[0]);
      return;
    }

    setManualDisplay(text);
    onManualSelection(text);
  };

  const handleSearch = (searchTerm) => {
    const filteredList = fullList.filter(kv => kv.displayText.toLowerCase().indexOf(searchTerm.current.value.toLowerCase()) > -1);
    setFilteredList(filteredList);
  };


  return (
    <div className="dropdown select-dropdown" id={id} name={label}>
      <a
        className={`btn select-btn btn-secondary dropdown-toggle ${errored ? 'errored' : ''}`}
        role="button"
        id="dropdownMenuLink"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
        onClick={onOpen}
        disabled={disabled}
      >
        <div style={{ width: '100%' }}>
          <span>{currentDisplay}</span>
          <span className="caret select-caret caret-margin" style={{ right: '2%' }} />
        </div>
      </a>
      <div className="dropdown-menu select-dropdown-menu" onBlur={() => {
        selectManual(searchTerms.current.value);
        onBlur && onBlur();
      }}>
        <input
          type="text"
          placeholder={searchPlaceholder ? searchPlaceholder : 'Search...'}
          className="search-bar"
          onChange={() => handleSearch(searchTerms)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              selectManual(searchTerms.current.value);
            }
          }}
          ref={searchTerms}
        />
        <div className="dropdown-divider" />
        <ul style={{ paddingLeft: 0 }}>
          {filteredList.map(item => (
            <li
              className={item.key === currentSelection ? 'dropdown-item select-dropdown-item active' : 'dropdown-item select-dropdown-item'}
              onMouseUp={() => {
                select(item.key);
              }}
              key={item.key}
            >
              {item.displayText}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
