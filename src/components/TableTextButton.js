import {div} from 'react-hyperscript-helpers';
import {Styles} from '../libs/theme';
import { applyHoverEffects, setDivAttributes, setStyle } from '../libs/utils';

export default function TableTextButton(props) {

  //default function for mouseEnter
  const onMouseEnterFn = (e) => {
    applyHoverEffects(e, hoverStyle);
  };

  //default function for mouseLeave
  const onMouseLeaveFn = (e) => {
    applyHoverEffects(e, style);
  };

  const {
    onClick,
    disabled = false,
    hoverStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER,
    onMouseEnter = onMouseEnterFn,
    onMouseLeave = onMouseLeaveFn,
    label,
    keyProp = `${label}-button`,
    dataTip
  } = props;
  const baseStyle = props.style || Styles.TABLE.TABLE_TEXT_BUTTON;
  const style = setStyle(disabled, baseStyle, 'backgroundColor');
  const divAttributes = setDivAttributes(disabled, onClick, style, dataTip, onMouseEnter, onMouseLeave, keyProp);
  return (
    div(divAttributes, [label])
  );
}