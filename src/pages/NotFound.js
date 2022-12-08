import React from 'react';
import {PageHeading} from '../components/PageHeading';
import {Link} from 'react-router-dom';

export default function NotFound() {

  return <div className={'container container-wide'}>
    <div className={'row no-margin'}>
      <div className={'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding'}>
        <PageHeading id={'notFound'} color={'common'} title={'Sorry, the page you were looking for was not found.'}/>
      </div>
      <Link id={'btn_back'} className={'btn-primary btn-back f-left'} style={{'marginTop': '15px'}} to={'/home'}>
        Back to Home
      </Link>
    </div>
  </div>;
}
