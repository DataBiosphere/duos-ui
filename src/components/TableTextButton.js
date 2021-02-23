import {div} from 'react-hyperscript-helpers';
import {Styles} from '../libs/theme';
import forEach from 'lodash/forEach';

export default function TableTextButton(props) {

  const onMouseEnterFn = (e) => {
    forEach(hoverStyle, (value, key) => {
      e.target.style[key] = value;
    });
  };

  const onMouseLeaveFn = (e) => {
    forEach(style, (value, key) => {
      e.target.style[key] = value;
    });
  };

  const {
    buttonKey,
    onClick,
    style = Styles.TABLE.TABLE_BUTTON,
    hoverStyle = Styles.TABLE.TABLE_BUTTON_HOVER,
    onMouseEnter = onMouseEnterFn,
    onMouseLeave = onMouseLeaveFn,
    label,
    isRendered = true
  } = props;

  return (
    div({
      style,
      key: buttonKey,
      onMouseEnter,
      onMouseLeave,
      isRendered,
      onClick
    }, [label])
  );
}