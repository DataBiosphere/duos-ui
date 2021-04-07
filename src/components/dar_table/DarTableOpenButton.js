import TableTextButton from '../TableTextButton';
import { h } from 'react-hyperscript-helpers';

export default function OpenButton(props) {
  const { dar, index, openConfirmation, label, disabled } = props;
  return h(TableTextButton, {
    onClick: () => openConfirmation(dar, index),
    key: `${label}-election-dar-${dar.referenceId}`,
    label,
    disabled,
    dataTip: disabled ? "You do not have permission to open this election" : "Open Election"
  });
}