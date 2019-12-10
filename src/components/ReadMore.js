import get from 'lodash/get';
import { Component } from 'react';
import { a, div, hh, span } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';


export const ReadMore = hh(class ReadMore extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      content: get(this.props, 'content', ''),
      className: get(this.props, 'className', ''),
      style: get(this.props, 'style', {}),
      charLimit: get(this.props, 'charLimit', 100),
      readMoreText: get(this.props, 'readMoreText', 'Read More'),
      readLessText: get(this.props, 'readLessText', 'Read Less')
    };
  }

  componentDidMount() {
    ReactTooltip.rebuild();
  }

  getContent = () => {
    if (this.state.expanded) {
      return this.state.content;
    } else {
      return this.state.content.slice(0, this.state.charLimit) + ' ...';
    }
  };

  readMore = () => {
    this.setState(prev => {
      prev.expanded = true;
      return prev;
    });
  };

  readLess = () => {
    this.setState(prev => {
      prev.expanded = false;
      return prev;
    });
  };

  render() {
    const readLink = this.state.expanded ?
      a({ onClick: () => this.readLess() }, [this.state.readLessText]) :
      a({ onClick: () => this.readMore() }, [this.state.readMoreText]);
    return div({}, [
      span({
        className: this.state.className,
        style: this.state.style,
      }, this.getContent()),
      readLink
    ]);
  }
});
