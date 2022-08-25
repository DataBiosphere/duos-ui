import { useState, useEffect, useRef } from 'react';
import {div, input, span, a, ul, li } from 'react-hyperscript-helpers';
import './SearchSelect.css';

export const SearchSelect = (props) => {
  const { onSelection, placeholder, options, searchPlaceholder, id, label } = props;
  const [currentDisplay, setCurrentDisplay] = useState(placeholder || '');
  const [currentSelection, setCurrentSelection] = useState(props.value);
  const [fullList, setFullList] = useState(props.options);
  const [filteredList, setFilteredList] = useState(props.options);
  const searchTerms = useRef('');

  useEffect(() => {
    setCurrentSelection(props.value);
    const item = props.options.filter(i => i.key === props.value);
    if (item && item.length) {
      setCurrentDisplay(item[0].displayText);
    }

    setFullList(props.options);
    setFilteredList(props.options);
  }, [props.value, props.options]);

  const setDisplay = (selection) => {
    const item = options.filter(i => i.key === selection);
    if (item && item.length) {
      setCurrentDisplay(item[0].displayText);
    }
  };

  const select = (selection) => {
    return () => {
      setCurrentSelection(selection);
      setDisplay(selection);
      onSelection(selection);
    };
  };

  const handleSearch = (searchTerm) => {
    const filteredList = fullList.filter(kv => kv.displayText.toLowerCase().indexOf(searchTerm.current.value.toLowerCase()) > -1);
    setFilteredList(filteredList);
  };

  return (
    div({ className: 'dropdown select-dropdown', id, name: label }, [
      a({
        className: 'btn select-btn btn-secondary dropdown-toggle',
        role: 'button',
        id: 'dropdownMenuLink',
        'data-toggle': 'dropdown',
        'aria-haspopup': true,
        'aria-expanded': false
      }, [
        div({
          style: { width: '100%' }
        }, [
          span(currentDisplay),
          span({ className: 'caret select-caret caret-margin', style: { right: '2%' } })
        ])
      ]),
      div({
        className: 'dropdown-menu select-dropdown-menu'
      }, [
        input({
          type: 'text',
          placeholder: searchPlaceholder ? searchPlaceholder : 'Search...',
          className: 'search-bar',
          onChange:() => handleSearch(searchTerms),
          ref: searchTerms
        }),
        div({
          className: 'dropdown-divider'
        }),
        ul({}, filteredList.map(item => {
          return li({
            className: item.key === currentSelection
              ? 'dropdown-item select-dropdown-item active'
              : 'dropdown-item select-dropdown-item',
            onClick: select(item.key),
          }, [item.displayText]);
        }))
      ])
    ])
  );
};
