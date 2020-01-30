import { Component } from 'react';
import { a, circle, div, h1, h3, hr, img, p, span, svg, br } from 'react-hyperscript-helpers';
import { SignIn } from '../components/SignIn';


class Home extends Component {

  render() {

    return (

      div({ className: 'row home' }, [
        div({ className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          h1({ className: 'home-title' }, ['Data Use Oversight System']),
          div({ className: 'home-title-description' },
            ['Expediting data access for researchers, by facilitating and enhancing data access committees\' workflows']),
          hr({ className: 'home-line' }),
          div({ isRendered: !this.props.isLogged, style: { textAlign: 'center' } }, [
            div({}, ['Want to explore datasets and make a data access request?']),
            div({ style: { margin: '1rem 0 1rem 0' } }, [
              SignIn({ props: this.props, onSignIn: () => this.props.onSignIn(), history: this.props.history })
            ]),
            div({}, [
              span({}, [
                'Don\'t have a Google Account?',
                br(),
                'Create a new one ',
                a({
                  href: 'https://accounts.google.com/SignUp?continue:https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fauth%3Fopenid.realm%26scope%3Demail%2Bprofile%2Bopenid%26response_type%3Dpermission%26redirect_uri%3Dstoragerelay%3A%2F%2Fhttp%2Flocalhost%3A8000%3Fid%253Dauth721210%26ss_domain%3Dhttp%3A%2F%2Flocalhost%3A8000%26client_id%3D832251491634-smgc3b2pogqer1mmdrd3hrqic3leof3p.apps.googleusercontent.com%26fetch_basic_profile%3Dtrue%26hl%3Des-419%26from_login%3D1%26as%3D43c5de35a7316d00&ltmpl:popup',
                  target: '_blank'
                }, ['here. ']),
                br(),
                'Or sign up with an existing email address ',
                a({
                  href: 'https://support.google.com/accounts/answer/176347',
                  target: '_blank'
                }, ['here.'])
              ])
            ])
          ]),
          div({ className: 'home-content' }, [
            p({}, [
              'There are restrictions on researching human genomics data. For example: ',
              span({ className: 'italic' }, ['“Data can only be used for breast cancer research with non-commercial purpose”.'])
            ]),
            p({}, ['The Data Use Oversight system ensures that researchers using genomics data honor these restrictions.'])
          ]),
          h3({}, ['What is DUOS?']),
          div({ className: 'home-content-references' }, [
            svg({ height: '14', width: '14' }, [
              circle({ cx: '7', cy: '7', r: '7', fill: '#016798' }, [])
            ]),
            span({}, ['Interfaces to transform data use restrictions to machine readable codes'])
          ]),
          div({ className: 'home-content-references' }, [
            svg({ height: '14', width: '14' }, [
              circle({ cx: '7', cy: '7', r: '7', fill: '#B22439' }, [])
            ]),
            span({}, ['A matching algorithm that checks if a data access request is compatible with the restrictions on the data'])
          ]),
          div({ className: 'home-content-references' }, [
            svg({ height: '14', width: '14' }, [
              circle({ cx: '7', cy: '7', r: '7', fill: '#3F8C51' }, [])
            ]),
            span({}, ['Interfaces for the data access committee (DAC) to evaluate data access requests requiring manual review'])
          ]),
          img({
            className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 home-content-graphic', alt: 'What is DUOS graphic', src: '/images/what_is_duos.svg'
          })
        ])
      ])
    );
  }
}

export default Home;
