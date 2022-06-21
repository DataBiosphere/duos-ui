import {h} from 'react-hyperscript-helpers';
import Box from '@mui/material/Box';
import {KeyboardArrowUp} from '@material-ui/icons';

export function ScrollButton(props) {
  const { children, to, additionalStyle } = props;

  const style = Object.assign({cursor: 'pointer'}, additionalStyle);

  const onClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(to);

    if (anchor) {
      anchor.scrollIntoView();
    }
  };

  return h(Box, { onClick, style }, [
    children
  ]);
}

export function ScrollToTopButton(props) {
  const { to } = props;

  return h(ScrollButton, { to, additionalStyle: {marginLeft: '2rem'} }, [
    h(KeyboardArrowUp)
  ]);
}

export default {
  ScrollButton,
  ScrollToTopButton
}