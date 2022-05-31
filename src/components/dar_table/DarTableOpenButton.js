import TableTextButton from '../TableTextButton';
import { Styles } from '../../libs/theme';
import { h } from 'react-hyperscript-helpers';

export default function OpenButton(props) {
  const { dar, index, openConfirmation, label, disabled, addBaseStyle } = props;
  const baseStyle = Styles.TABLE.TABLE_TEXT_BUTTON_SUCCESS;

  return h(TableTextButton, {
    onClick: () => openConfirmation(dar, index),
    key: `${label}-election-dar-${dar.referenceId}`,
    label,
    disabled,
    dataTip: disabled ? 'You do not have permission to open this election' : 'Open Election',
    style: Object.assign({}, baseStyle, addBaseStyle),
    hoverStyle: Styles.TABLE.TABLE_BUTTON_TEXT_HOVER_SUCCESS
  });
}
