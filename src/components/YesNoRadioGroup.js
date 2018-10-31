import { Component, } from 'react';
import { div, input, hh, label, span } from 'react-hyperscript-helpers';
import PropTypes from 'prop-types';
import './RadioGroups.css';

export const YesNoRadioGroup = hh(class YesNoRadioGroup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedValue: this.props.value,
    };
  }

  selectOption = (e, value) => {
    e.preventDefault();
    this.setState(prev => {
      prev.selectedValue = value;
      return prev;
    }, () => {
      this.props.onChange(e, this.props.name, value);
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.value !== prevState.selectedValue) {
      this.setState({
        selectedValue: prevProps.value,
      });
    }
  }

  render() {

    const { id, name } = this.props;
    const { selectedValue } = this.state;

    const isYes = selectedValue === 'true' || selectedValue === true || selectedValue === '1';
    const isNo = selectedValue === 'false' || selectedValue === false || selectedValue === '0';

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