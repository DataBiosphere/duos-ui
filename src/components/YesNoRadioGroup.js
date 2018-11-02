import { PureComponent, } from 'react';
import { div, input, hh, label, span } from 'react-hyperscript-helpers';
import PropTypes from 'prop-types';
import './RadioGroups.css';

export const YesNoRadioGroup = hh(class YesNoRadioGroup extends PureComponent {

  selectOption = (e, value) => {
    e.preventDefault();
    this.props.onChange(e, this.props.name, value);
  };

  static defaultProps = {
    value: null
  }

  render() {

    const { id, name, value } = this.props;

    const isYes = value === 'true' || value === true || value === '1';
    const isNo = value === 'false' || value === false || value === '0';

    return (

      div({ className: 'radio-inline' }, [
        label({
          id: "lbl_positive_" + id,
          htmlFor: "rad_positive_" + id,
          onClick: (e) => this.selectOption(e, 'true'),
          className: "radio-wrapper"
        }, [
            input({
              value: 'true',
              type: "radio",
              id: "rad_positive_" + id,
              name: name,
              checked: isYes,
              onChange: () => { }
            }),
            span({ className: "radio-check" }),
            span({ className: "radio-label" }, ["Yes"])
          ]),
        label({
          id: "lbl_negative_" + id,
          htmlFor: "rad_negative_" + id,
          onClick: (e) => this.selectOption(e, 'false'),
          className: "radio-wrapper"
        }, [
            input({
              value: 'false',
              type: "radio",
              id: "rad_negative_" + id,
              name: name,
              checked: isNo,
              onChange: () => { }
            }),
            span({ className: "radio-check" }),
            span({ className: "radio-label" }, ["No"])
          ]),
      ])
    );
  }
});

YesNoRadioGroup.PropTypes = {
  name: PropTypes.string,
  value: PropTypes.bool
};