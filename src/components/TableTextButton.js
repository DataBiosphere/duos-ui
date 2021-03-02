import {div} from 'react-hyperscript-helpers';
import {Styles} from '../libs/theme';
import { applyHoverEffects } from '../libs/utils';

export default function TableTextButton(props) {

  const onMouseEnterFn = (e) => {
    applyHoverEffects(e, hoverStyle);
  };

  const onMouseLeaveFn = (e) => {
    applyHoverEffects(e, style);
  };

  const {
    onClick,
    style = Styles.TABLE.TABLE_TEXT_BUTTON,
    hoverStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER,
    onMouseEnter = onMouseEnterFn,
    onMouseLeave = onMouseLeaveFn,
    label,
    isRendered = true
  } = props;

  return (
    div({
      style,
      onMouseEnter,
      onMouseLeave,
      isRendered,
      onClick
    }, [label])
  );
}