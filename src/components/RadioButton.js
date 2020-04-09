import {div, input, label, span} from 'react-hyperscript-helpers';
import _ from 'lodash/fp';

export const RadioButton = (props) => {

  const wrapperStyle = {
    fontSize: 15,
    lineHeight: '2rem',
    color: 333,
    fontFamily: '\'Roboto\', sans-serif',
    cursor: 'pointer',
    position: 'relative',
  };

  const uncheckedStyle = {
    fontSize: 15,
    lineHeight: '1.5rem',
    color: 333,
    cursor: 'pointer',
    boxSizing: 'border-box',
    position: 'absolute',
    top: 0,
    left: 0,
    height: 20,
    width: 20,
    backgroundColor: 'white',
    borderRadius: '50%',
    border: '1px solid #999999',
  };

  const checkedStyle = _.merge(uncheckedStyle, {
    boxShadow: 'rgb(0, 0, 0) 0 0 0 1px',
    backgroundColor: '#2196F3',
    border: '2px solid white',
  });

  const labelStyle = {
    cursor: 'pointer',
    color: '#603B9B',
    fontSize: 15,
    fontWeight: 'normal',
  };

  const descriptionStyle = {
    marginLeft: '.25rem',
    fontWeight: 'normal',
  };

  return (
    div({style: props.style}, [
      label({style: wrapperStyle}, [
        div({style: {float: 'left'}}, [
          input({
            id: props.id,
            type: 'radio',
            name: props.name,
            value: props.value,
            defaultChecked: props.defaultChecked,
            onClick: props.onClick,
            disabled: props.disabled,
          }),
          span({
            style: props.defaultChecked ? checkedStyle : uncheckedStyle,
          }),
        ]),
        div({style: {marginLeft: '3rem'}}, [
          span({style: labelStyle}, [props.label]),
          span({style: descriptionStyle}, [props.description]),
        ]),
      ]),
    ])
  );
};
