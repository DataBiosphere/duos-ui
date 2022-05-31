import { Component } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { Link } from 'react-router-dom';

class NotFound extends Component {

  render() {

    return (
      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
            PageHeading({ id: 'notFound', color: 'common', title: 'Sorry, the page you were looking for was not found.' }),
          ]),
          h(Link, { id: 'btn_back', className: 'btn-primary btn-back f-left', style: { 'marginTop': '15px' }, to: '/home' }, ['Back to Home']),
        ])
      ])
    );
  }
}

export default NotFound;
