import { Component } from 'react';
import { a, button, circle, div, h, h1, h3, hr, img, p, span, svg } from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';
import { SignIn } from '../components/SignIn';
import { HomeReadMore } from '../components/HomeReadMore';
import { Link } from 'react-router-dom';

class Home extends Component {

  render() {
  const hometitle = {
      color: '#FFFFFF',
      fontFamily: 'Montserrat',
      fontSize: '28px',
      fontWeight: 600,
      textAlign: 'center'
    }

    const homebannerdescription = {
      color: '#FFFFFF',
      fontFamily: 'Montserrat',
      fontSize: '20px',
      textAlign: 'center',
      whiteSpace: 'pre-wrap'
    }

    const header = {
      color: '#1F3B50',
      fontFamily: 'Montserrat',
      fontSize: '24px',
      fontWeight: 600,
      textAlign: 'center'
    }

    const subheader = {
      color: '#1F3B50',
      fontFamily: 'Montserrat',
      fontSize: '16px',
      textAlign: 'center',
      margin: '1rem 270px',
      whiteSpace: 'pre-wrap'
    }

    const paragraph = {
      color: '#1F3B50',
      margin: '0 210px 2rem 210px',
      fontFamily: 'Montserrat',
      fontSize: '14px',
      textAlign: 'center',
      textIndent: '10px',
      whiteSpace: 'pre-wrap'
    }

    const buttonStyle = {
      borderRadius: '5px',
      backgroundColor: '#00689F',
      fontFamily: 'Montserrat',
      fontSize: '16px',
      fontWeight: 500,
      color: '#FFFFFF',
      width: '50%',
      padding: '10px 20px'
    }

    return (

      div({ className: 'row' }, [
        div({ className: 'col-lg-12' }, [
          div({ className: 'row no-margin', style: { backgroundColor: 'white', height: '350px', position: 'relative' }}, [
            img({ style: { height: 'inherit', minWidth: '100%', transform: 'scale(1.1,1)', zIndex: '-99' }, src: '/images/home_header_background.png'}),
            div({ style: {position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'} }, [
              img({ style: { height: '80px', width: '300px', display: 'block', margin: 'auto auto' }, src: '/images/duos_logo.svg' }),
              h1({ style: hometitle }, ['Data Use Oversight System']),
              div({ style: homebannerdescription }, ['Expediting data access for researchers, by facilitating and \nenhancing data access committee\'s workflows'])
            ]),
            div({ style: { height: '35px', padding: '2em 2em 0 0', display: 'inline-block', position: 'absolute', top: '1rem', right: '1rem'} }, [
              span({ style: { color: '#FFFFFF'}}, ['Already registered?']),
              SignIn({ props: this.props, onSignIn: () => this.props.onSignIn(), history: this.props.history })
              ]),
          ]),
          div({ className: 'row' }, [
            div({ style: { margin: '50px auto' } }, [
              h1({ style: header }, ['What is DUOS and how does it work?']),
              h3( { style: subheader }, ['DUOS is a semi-automated data access management service which governs compliant \nsecondary use of human genomics data by leveraging:']),
              div({}, [
                img({
                  className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: { padding: '1rem 180px', margin: 'auto auto' }, alt: 'What is DUOS graphic', src: '/images/duos_process_flow.png'
                })
              ])
            ]),
          ]),
          div({ className: 'row' }, [
            div({ className: 'row', style: { background: '#eff0f2', margin: '50px 0', padding: '60px 0 72px 0' } }, [
            div({ className: 'col-lg-4 col-lg-offset-1' }, [
              p({ style: header }, ['Are you a researcher?']),
              p( { style: {...paragraph, margin: 'auto auto'} }, ['Creating a DUOS account is quick and easy.\nLorem ipsum dolor sit amet, consectetur adipiscing.\nDuis aute irure dolor in reprehenderit.']),
                div({className:'row', style: {display: 'block', margin: 'auto auto', position: 'relative', left: '25%'}}, [button({ className: 'cell-button', style: buttonStyle }, ['REGISTER'])])
            ]),
            div({ className: 'col-lg-4 col-lg-offset-2'}, [
              p({ style: header }, ['Are you a DAC member?']),
              p( { style: {...paragraph, margin: 'auto auto'} }, ['Learn how managing data access and\nlorem ipsum dolor sit amet, consectetur\nadipiscing elit.']),
              div({className:'row', style: {display: 'block', margin: 'auto auto', position: 'relative', left: '25%'}}, [button({ className: 'cell-button', style: buttonStyle }, ['LEARN MORE'])])
            ])
          ]),
          ]),
          div({ className: 'row' }, [
          div({ className: 'col-lg-10 col-lg-offset-1' }, [
          div({}, [
            h1({style: header}, ['About DUOS']),
            h3({style: subheader}, ['Overview of the system and development']),
            HomeReadMore({ props: this.props, style: { fontFamily: 'Montserrat', fontSize: '14px', fontWeight: 500, textAlign: 'center', display: 'block' }, content: [p({style:paragraph}, ['Increasingly, a major challenge to data sharing is navigating the complex web of restrictions on secondary data use. Human subjects datasets often have complex and/or ambiguous restrictions on future use deduced from the original consent form, which must be respected when utilizing data. Previously, such data use restrictions were uniquely drafted across institutions, creating vast inconsistencies and requiring the investment of significant human effort to determine if researchers should be permitted to use the data.'])], moreContent: [div({}, [p({style:paragraph}, 'As part of our efforts to enhance collaborative research, the Broad Institute developed the “Data Use Oversight System” (DUOS) to semi-automate and efficiently manage compliant sharing of human subjects data. DUOS\' objective is two-fold, to enhance data access committee\'s confidence that data use restrictions are respected while efficiently enabling appropriate data access.'),
            p({style:paragraph}, 'To better enable the use of existing human subjects datasets in future projects, DUOS mimics, in a semi-automated fashion, the data access request review processes common to DACs globally, like those in dbGaP. To this end, the system includes interfaces to capture and structure data use restrictions and data access requests as machine-readable data use terms based on the GA4GH\'s Data Use Ontology. With these machine-readable terms for dataset\'s use limitations and data access requests established, DUOS is able to trigger a matching algorithm to reason if data access should be granted given the research purpose and the data restrictions, serving as a decision support tool for DACs using DUOS.'),
            p({style:paragraph}, 'To evaluate the feasibility of using machine readable data use terms to interpret data use restrictions and access requests, we are piloting a trial of DUOS overseen by Partners’ Healthcare IRB. During the pilot, DACs comprised of governmental and non-governmental data custodians will pilot the use of DUOS, its ability to structure use limitations and access requests, and the accuracy of the DUOS algorithm. This aids us in improving the DUOS algorithm and providing feedback on the GA4GH Data Use Ontology based on experts’ feedback.')
            ])]}, [p({style:paragraph}, ['child text']),
          ])])
        ])
          ])
          ]),
      ])
    );
  }
}

export default Home;
