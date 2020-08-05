import get from 'lodash/get';
import { Component } from 'react';
import { a, div, hh, span } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';


export const ReadMore = hh(class ReadMore extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      inline: get(this.props, 'inline', false),
      content: get(this.props, 'content', [span({}, [''])]),
      moreContent: get(this.props, 'moreContent', [span({}, [''])]),
      className: get(this.props, 'className', ''),
      style: get(this.props, 'style', {}),
      readStyle: get(this.props, 'readStyle', {}),
      charLimit: get(this.props, 'charLimit', 100),
      readMoreText: get(this.props, 'readMoreText', 'Read More'),
      readLessText: get(this.props, 'readLessText', 'Read Less')
    };
  }

  componentDidMount() {
    ReactTooltip.rebuild();
  }

  getContent = () => {
    return this.state.inline ? this.getInlineContent() : this.getFormattedContent();
  };

  getInlineContent = () => {
    const content = this.state.expanded ? this.state.content : this.state.content.slice(0, this.state.charLimit) + ' ...';
    return span({
      className: this.state.className,
      style: this.state.style,
    }, content);
  };

  getFormattedContent = () => {
    return this.state.expanded ? [...this.state.content, ...this.state.moreContent] : this.state.content;
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

  getReadLink = (fun, text, classes) => {
    const linkElements = this.state.inline ? [text] :
      [text, span({className: classes, style: {padding: '0 1rem'}, 'aria-hidden': 'true'})];
    const linkElementsStyle = this.state.inline ? {} : this.state.readStyle;
    return a({ onClick: () => fun(), style: linkElementsStyle}, linkElements);
  }

  render() {
    const readLink = this.state.expanded ?
      this.getReadLink(this.readLess, this.state.readLessText, 'glyphicon glyphicon-chevron-up') :
      this.getReadLink(this.readMore, this.state.readMoreText, 'glyphicon glyphicon-chevron-down');
    return div({}, [
      this.getContent(),
      readLink
    ]);
  }
});
