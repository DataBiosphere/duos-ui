import { Component } from 'react';
import { div, input, hh, label } from 'react-hyperscript-helpers';

export const YesNoRadioGroup = hh(class YesNoRadioGroup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      yesno: null
    }
  }

  selectYes = (e) => {
    console.log('------------YES----------------');
    this.setState(prev => {
      prev.yesno = true;
      return prev;
    });
  }

  selectNo = (e) => {
    console.log('------------NO----------------');
    this.setState(prev => {
      prev.yesno = false;
      return prev;
    });
  }

  render() {

    return (

        div({className: 'radio-inline'}, [
          input({
            className: "regular-radio",
            value: true, type: "radio", id: "RadioOptionYes",
            name: "YesNoRadioGroup", onChange: this.selectYes, checked: this.state.yesno === true
          }),
          label({ for: "RadioOptionYes" }, []),
          label({ for: "RadioOptionYes", className: "radio-button-text" }, ["Yes"]),
          input({
            className: "regular-radio",
            value: false, type: "radio", id: "RadioOptionNo",
            name: "YesNoRadioGroup", onClick: this.selectNo, checked: this.state.yesno === false
          }),
          label({ for: "RadioOptionNo" }, []),
          label({ for: "RadioOptionNo", className: "radio-button-text" }, ["No"]),
        ])

    );
  }
});
