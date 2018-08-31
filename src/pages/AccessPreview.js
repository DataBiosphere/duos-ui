import { Component } from 'react';
import { div, button } from 'react-hyperscript-helpers';

class AccessPreview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }

    this.myHandler = this.myHandler.bind(this);
  }

  myHandler(event) {
    // TBD
  }

  render() {

    return (
      div({ className: "container " }, [
        "AccessPreviewResults Page",
        button({}, ["Click Me!"])
      ])
    );
  }
}

export default AccessPreview;

