import { Component } from 'react';
import { a, button, div, h1, h3, img, p, span } from 'react-hyperscript-helpers';
import { SignIn } from '../components/SignIn';
import { HomeReadMore } from '../components/HomeReadMore';

class Home extends Component {

  render() {
    const homeTitle = {
      color: '#FFFFFF',
      fontFamily: 'Montserrat',
      fontSize: '28px',
      fontWeight: 600,
      textAlign: 'center'
    };

    const homeBannerDescription = {
      color: '#FFFFFF',
      fontFamily: 'Montserrat',
      fontSize: '20px',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      padding: '0 10rem'
    };

    const duosLogo = {
      height: '80px',
      width: '300px',
      display: 'block',
      margin: 'auto auto',
      padding: '0 3rem'
    };

    const header = {
      color: '#1F3B50',
      fontFamily: 'Montserrat',
      fontSize: '24px',
      fontWeight: 600,
      textAlign: 'center'
    };

    const subHeader = {
      color: '#1F3B50',
      fontFamily: 'Montserrat',
      fontSize: '16px',
      textAlign: 'center',
      whiteSpace: 'pre-wrap'
    };

    const description = {
      color: '#1F3B50',
      fontFamily: 'Montserrat',
      fontSize: '14px',
      textAlign: 'center',
      textIndent: '10px',
      whiteSpace: 'pre-wrap',
      padding: '10px 30px',
    };

    const paragraph = {
      color: '#1F3B50',
      padding: '0 10rem 2rem 10rem',
      fontFamily: 'Montserrat',
      fontSize: '14px',
      textAlign: 'justify',
      textIndent: '10px'
    };

    const buttonStyle = {
      borderRadius: '5px',
      backgroundColor: '#00689F',
      fontFamily: 'Montserrat',
      fontSize: '16px',
      fontWeight: 500,
      color: '#FFFFFF',
      padding: '0 5rem',
      margin: '2rem auto'
    };

    const readMoreStyle = {
      fontFamily: 'Montserrat',
      fontSize: '14px',
      fontWeight: 500,
      textAlign: 'center',
      display: 'block'
    };

    return (

      div({ className: 'row' }, [
        div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
          div({ className: 'row no-margin', style: { backgroundColor: 'white', height: '350px', position: 'relative' }}, [
            img({ style: { height: 'inherit', minWidth: '100%', transform: 'scale(1.1,1)' }, src: '/images/home_header_background.png'}),
            div({ style: { position: 'absolute', width: '100%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}, [
              img({ style: duosLogo , alt: 'DUOS logo', src: '/images/duos_logo.svg' }),
              h1({ style: homeTitle }, ['Data Use Oversight System']),
              div({ style: homeBannerDescription }, [
                'Expediting data access for researchers, by facilitating and \nenhancing data access committee\'s workflows'])
            ]),
            div({ style: { padding: '2em 2em 0 0', display: 'flex', alignItems: 'center', position: 'absolute', top: '1rem', right: '1rem'}}, [
              span({ style: { color: '#FFFFFF', position: 'relative', float: 'left', margin: 'auto 1rem'}}, ['Already registered?']),
              SignIn({ props: this.props, onSignIn: () => this.props.onSignIn(), history: this.props.history, style: { position: 'relative', float: 'right'}})
            ])
          ]),
          div({ className: 'row' }, [
            div({ style: { margin: '50px auto' }}, [
              h1({ style: header }, ['What is DUOS and how does it work?']),
              h3({ style: subHeader },
                ['DUOS is a semi-automated data access management service which governs compliant \nsecondary use of human genomics data:']),
              div({}, [
                img({
                  className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                  style: { padding: '1rem 180px', margin: 'auto auto' },
                  alt: 'What is DUOS graphic',
                  src: '/images/duos_process_flow.png'
                })
              ])
            ])
          ]),
          div({ className: 'row', style: { background: '#eff0f2', margin: '50px 0', padding: '60px 0 72px 0' } }, [
            div({ className: 'col-lg-4 col-lg-offset-1 col-md-4 col-md-offset-1'}, [
              p({ style: header }, ['Are you a DAC member?']),
              p({ style: description }, [
                'Click here to learn how DUOS is helping DACs \nefficiently manage data access and use compliance.']),
              div({className:'row', style: { display: 'flex', justifyContent: 'center' }}, [
                button({ className: 'btn-primary', style: buttonStyle }, [
                  a({href: 'home_about', style: {color: '#fff'}}, ['LEARN MORE'])
                ])
              ])
            ]),
            div({ className: 'col-lg-4 col-lg-offset-2 col-md-4 col-md-offset-2' }, [
              p({ style: header }, ['Are you a researcher?']),
              p({ style: description }, [
                'Click here to register and start your data access request!']),
              div({className:'row', style: { display: 'flex', justifyContent: 'center' }}, [
                button({ className: 'btn-primary', style: buttonStyle }, [
                  a({
                    href: 'https://accounts.google.com/SignUp?continue:https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fauth%3Fopenid.realm%26scope%3Demail%2Bprofile%2Bopenid%26response_type%3Dpermission%26redirect_uri%3Dstoragerelay%3A%2F%2Fhttp%2Flocalhost%3A8000%3Fid%253Dauth721210%26ss_domain%3Dhttp%3A%2F%2Flocalhost%3A8000%26client_id%3D832251491634-smgc3b2pogqer1mmdrd3hrqic3leof3p.apps.googleusercontent.com%26fetch_basic_profile%3Dtrue%26hl%3Des-419%26from_login%3D1%26as%3D43c5de35a7316d00&ltmpl:popup',
                    style: { color: '#fff' }}, [
                      'REGISTER'
                  ])
                ])
              ])
            ])
          ]),
          div({ className: 'row' }, [
            div({ className: 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2' }, [
              div({}, [
                h1({ style: header }, ['About DUOS']),
                h3({ style: subHeader }, ['Overview of the system and development']),
                HomeReadMore({
                  props: this.props,
                  style: readMoreStyle ,
                  content: [
                    p({ style: paragraph }, [
                      'Increasingly, a major challenge to data sharing is navigating the complex web of restrictions on secondary data use. Human subjects datasets often have complex and/or ambiguous restrictions on future use deduced from the original consent form, which must be respected when utilizing data. Previously, such data use restrictions were uniquely drafted across institutions, creating vast inconsistencies and requiring the investment of significant human effort to determine if researchers should be permitted to use the data.'
                    ])
                  ],
                  moreContent: [
                    div({}, [
                      p({ style: paragraph }, 'As part of our efforts to enhance collaborative research, the Broad Institute developed the “Data Use Oversight System” (DUOS) to semi-automate and efficiently manage compliant sharing of human subjects data. DUOS\' objective is two-fold, to enhance data access committee\'s confidence that data use restrictions are respected while efficiently enabling appropriate data access.'),
                      p({ style: paragraph }, 'To better enable the use of existing human subjects datasets in future projects, DUOS mimics, in a semi-automated fashion, the data access request review processes common to DACs globally, like those in dbGaP. To this end, the system includes interfaces to capture and structure data use restrictions and data access requests as machine-readable data use terms based on the GA4GH\'s Data Use Ontology. With these machine-readable terms for dataset\'s use limitations and data access requests established, DUOS is able to trigger a matching algorithm to reason if data access should be granted given the research purpose and the data restrictions, serving as a decision support tool for DACs using DUOS.'),
                      p({ style: paragraph }, 'To evaluate the feasibility of using machine readable data use terms to interpret data use restrictions and access requests, we are piloting a trial of DUOS overseen by Partners’ Healthcare IRB. During the pilot, DACs comprised of governmental and non-governmental data custodians will pilot the use of DUOS, its ability to structure use limitations and access requests, and the accuracy of the DUOS algorithm. This aids us in improving the DUOS algorithm and providing feedback on the GA4GH Data Use Ontology based on experts’ feedback.')
                    ])
                  ]
                })
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default Home;
