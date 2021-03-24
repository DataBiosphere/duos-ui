import {div, input, label, span} from 'react-hyperscript-helpers';
import * as fp from 'lodash/fp';

export const RadioButton = (props) => {

  const wrapperStyle = {
    fontSize: 15,
    lineHeight: '2rem',
    color: 333,
    fontFamily: props.font ? props.font : '\'Roboto\', sans-serif',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    position: 'relative',
  };

  const uncheckedStyle = {
    fontSize: props.fontSize ? props.fontSize : 15,
    lineHeight: '1.5rem',
    color: 333,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
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

  const checkedStyle = fp.merge(uncheckedStyle, {
    boxShadow: 'rgb(0, 0, 0) 0 0 0 1px',
    backgroundColor: '#2196F3',
    border: '2px solid white',
  });

  const labelStyle = {
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    color: props.color ? props.color : '#603B9B',
    fontSize: props.fontSize ? props.fontSize : 15,
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
