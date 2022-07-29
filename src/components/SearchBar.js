
import { useRef } from 'react';
import { div, input } from 'react-hyperscript-helpers';
import { Styles} from '../libs/theme';
import { defaultTo } from 'lodash/fp';

export default function SearchBar(props) {
  const { handleSearchChange } = props;
  const searchTerms = useRef('');

  const width = props.width ? props.width : '100%';
  const margin = props.margin ? props.margin : '';
  const button = props.button ? props.button : div();

  const style = props.style ? props.style : {
    width: width,
    border: '1px solid #cecece',
    backgroundColor: '#f3f6f7',
    borderRadius: '5px',
    height: '4rem',
    paddingLeft: '2%',
    fontFamily: 'Montserrat',
    fontSize: '1.5rem',
    margin: margin,
  };

  return div({className: 'right-header-section', style: Styles.RIGHT_HEADER_SECTION}, [
    input({
      type: 'text',
      placeholder: 'Enter search terms',
      //Styling seems to only work when defined here, variable reference doesn't work
      //Odds are there's a competing style, need to figure out where it's coming from
      style,
      onChange:() => handleSearchChange(props.searchRef ? defaultTo('')(props.searchRef.current.value) : searchTerms),
      ref: props.searchRef || searchTerms
    }),
    button
  ]);
}