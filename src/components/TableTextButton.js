import {div} from 'react-hyperscript-helpers';
import {Styles} from '../libs/theme';
import { applyHoverEffects } from '../libs/utils';

export default function TableTextButton(props) {

  //default function for mouseEnter
  const onMouseEnterFn = (e) => {
    applyHoverEffects(e, hoverStyle);
  };

  //default function for mouseLeave
  const onMouseLeaveFn = (e) => {
    applyHoverEffects(e, style);
  };

  const setStyle = (disabled, baseStyle) => {
    const opacity = disabled ? 0.5 : 1;
    return {opacity, ...baseStyle};
  };

  const setDivAttributes = (disabled, props, style, dataTip) => {
    if(!disabled) {
      const {onClick, onMouseEnter = onMouseEnterFn, onMouseLeave = onMouseLeaveFn} = props;
      return {onClick, onMouseEnter, onMouseLeave, style, "data-tip": dataTip};
    }
    return {style, disabled, "data-tip": dataTip};
  };

  const {
    disabled = false,
    hoverStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER,
    label,
    dataTip
  } = props;
  const baseStyle = props.style || Styles.TABLE.TABLE_TEXT_BUTTON;
  const style = setStyle(disabled, baseStyle);
  const divAttributes = setDivAttributes(disabled, props, style, dataTip);

  return (
    div(divAttributes, [label])
  );
}