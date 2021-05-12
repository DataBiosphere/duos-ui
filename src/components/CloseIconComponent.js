import { button, span } from 'react-hyperscript-helpers';

export default function CloseIconComponent(props) {
  const { closeFn } = props;
  return button({
    type: 'button',
    className: 'modal-close-btn close',
    onClick: closeFn
  }, [
    span({ className: 'glyphicon glyphicon-remove default-color'})
  ]);
}