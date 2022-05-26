import { Component } from 'react';
import { div, a, hh, h2, span, h } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import './AdminConsoleBox.css';

export const AdminConsoleBox = hh(class AdminConsoleBox extends Component {

  render() {

    let tag = a({}, []);

    const badge = this.props.unreviewedCases && this.props.unreviewedCases > 0 ?
      div({ className: 'pcases-medium-tag' }, [this.props.unreviewedCases])
      : null;

    const iconTag = div({ id: this.props.id + '-icon', className: 'admin-box-icon ' + this.props.iconName }, []);
    const titleTag = h2({ id: this.props.id + '-title', className: 'admin-box-title ' + this.props.color + '-color' }, [this.props.title]);
    const descriptionTag = span({ id: this.props.id + '-description', className: 'admin-box-description' }, [this.props.description]);
    const textWrapTag = div({ id: this.props.id + '-text', className: 'admin-box-text ' + this.props.iconSize }, [titleTag, badge, descriptionTag]);


    if (this.props.url !== undefined && this.props.clickHandler === undefined) {
      tag = h(Link, { id: this.props.id, to: this.props.url, className: 'admin-box-wrapper' }, [
        iconTag, textWrapTag
      ]);
    }

    if (this.props.url === undefined && this.props.clickHandler !== undefined) {
      tag = a({ id: this.props.id, onClick: this.props.clickHandler, className: 'admin-box-wrapper' }, [
        iconTag, textWrapTag
      ]);
    }

    return tag;
  }

});
