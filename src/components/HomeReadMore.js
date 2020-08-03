import get from 'lodash/get';
import { Component } from 'react';
import { a, div, hh, span } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';


export const HomeReadMore = hh(class HomeReadMore extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      content: get(this.props, 'content', [span({}, [''])]),
      moreContent: get(this.props, 'moreContent', [span({}, [''])]),
      className: get(this.props, 'className', ''),
      style: get(this.props, 'style', { textAlign: 'center' }),
      readMoreText: get(this.props, 'readMoreText', 'Read More'),
      readLessText: get(this.props, 'readLessText', 'Read Less')
    };
  }

  componentDidMount() {
    ReactTooltip.rebuild();
  }

  getContent = () => {
    if (this.state.expanded) {
      return [...this.state.content, ...this.state.moreContent];
    } else {
      return this.state.content;
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
      a({ onClick: () => this.readLess(), style: this.state.style }, [this.state.readLessText, span({className: 'glyphicon glyphicon-chevron-up', style: {padding: '0 1rem'}, 'aria-hidden': 'true'})]) :
      a({ onClick: () => this.readMore(), style: this.state.style }, [this.state.readMoreText, span({className: 'glyphicon glyphicon-chevron-down', style: {padding: '0 1rem'}, 'aria-hidden': 'true'})]);
    return div({}, [
      this.getContent(),
      readLink
    ]);
  }
});
