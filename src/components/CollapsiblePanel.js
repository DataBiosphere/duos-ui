import { Component } from 'react';
import { div, hh, a, h3, i } from 'react-hyperscript-helpers';
import './CollapsiblePanel.css';

export const CollapsiblePanel = hh(class CollapsiblePanel extends Component {

  constructor(props) {
    super(props);
    this.state = {
      expanded: this.props.expanded
    };
  }

  toggle = () => {
    this.setState(prev => {
      prev.expanded = ! prev.expanded;
      return prev;
    });
  };

  render() {
    return (
      div({ id: this.props.id, className: 'collapsible-panel' }, [
        div({ className: 'panel-heading' }, [
          a({ id: 'btn_collapse_' + this.props.id, onClick: this.toggle }, [
            h3({ id: 'lbl_' + this.props.id, className: 'italic ' + this.props.color + '-color'}, [
              this.props.title,
              i({ className: this.state.expanded ? 'pull-right glyphicon glyphicon-chevron-up' : 'pull-right glyphicon glyphicon-chevron-down' }),
            ]),
          ])
        ]),
        div({ className: 'panel-content ' + (this.state.expanded ? 'expanded' : 'collapsed') }, [
          this.props.children
        ])
      ])
    );
  }
});
