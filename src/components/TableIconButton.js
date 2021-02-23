import { Styles } from '../libs/theme';
import { h } from 'react-hyperscript-helpers';
import { Block } from '@material-ui/icons';
import { applyHoverEffects } from '../libs/utils';

export default function TableIconButton(props) {
  const onMouseEnterFn = (e) => {
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
    isRendered = true
  } = props;

  //NOTE: switch this out with material ui icons setup
  return (
    h(Block, {
      style,
      onMouseEnter,
      onMouseLeave,
      isRendered,
      onClick
    })
  );
};
