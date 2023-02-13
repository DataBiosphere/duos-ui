import { Styles } from '../libs/theme';
import { h, span } from 'react-hyperscript-helpers';
import { applyHoverEffects, setDivAttributes, setStyle } from '../libs/utils';
import { makeStyles } from '@mui/styles';
import { isNil } from 'lodash';
import {useEffect} from 'react';
import ReactTooltip from 'react-tooltip';

const useStyles = makeStyles({
  root: {
    backgroundColor: 'inherit',
    color: 'inherit',
    pointerEvents: 'none',
    fontSize: 28,
  }
});

export default function TableIconButton(props) {

  useEffect(() => {
    ReactTooltip.rebuild();
  }, []);

  const onMouseEnterFn = (e) => {
    e.target.style.cursor = 'pointer';
    applyHoverEffects(e, hoverStyle);
  };

  const onMouseLeaveFn = (e) => {
    applyHoverEffects(e, style);
  };

  const {
    onClick,
    style = Styles.TABLE.TABLE_ICON_BUTTON, //NOTE: create defaults for icons
    hoverStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER, //NOTE: create defaults for icons
    onMouseEnter = onMouseEnterFn,
    onMouseLeave = onMouseLeaveFn,
    isRendered = true,
    dataTip = '',
    keyProp,
    disabled = false
  } = props;
  const Icon = props.icon;
  const classes = useStyles();
  const appliedStyle = setStyle(disabled, style, 'color');
  const attributes = setDivAttributes(disabled, onClick, appliedStyle, dataTip, onMouseEnter, onMouseLeave, keyProp);

  //NOTE: span wrapper is needed for svg child elements due to flaky behavior onMouseEnter and onMouseLeave
  // https://github.com/facebook/react/issues/4492 --> NOTE: though the issue is from the React repo, the bug is tied to browser specs, NOT React
  return (
    span(attributes, [
      h(Icon, {
        isRendered: isRendered && !isNil(Icon),
        className: classes.root
      })
    ])
  );
}
