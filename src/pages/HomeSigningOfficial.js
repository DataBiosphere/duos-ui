import {Component} from 'react';
import {a, div, h, h1, h3, p, img, span} from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';
import LibraryCardAgreement from '../assets/Library_Card_Agreement_2021.pdf';

class HomeSigningOfficial extends Component {

  render() {

    const imageWrapper = {
      padding: '3rem',
      margin: '0 3rem',
      height: 'auto',
      maxHeight: '300px',
      width: 'auto',
      maxWidth: '100%',
      float: 'none'
    };

    const header = {
      fontWeight: '600',
      padding: '0 5rem',
      textAlign: 'left'
    };

    const sectionWrapper = {
      fontFamily: 'Montserrat',
      margin: '2rem 0',
      overflow: 'auto',
      textAlign: 'left',
      color: '#1F3B50',
      display: 'flex',
      flexDirection: 'column'
    };

    const sectionTitle = {
      fontWeight: '600',
      color: '#2899BC',
      padding: '0 5rem',
      textAlign: 'left'
    };

    const faqTitle = {
      padding: '0 5rem',
      textAlign: 'left'
    };

    const sectionBody = {
      padding: '0 5rem',
    };

    const paragraph = {
      padding: '1rem 0 0 0'
    };

    return (
      div({className: 'row home'}, [
        div({className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12'}, [
          div({style: sectionWrapper}, [
            h1({style: header, className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, ['DUOS for Signing Officials'])
          ]),
          div({style: sectionWrapper}, [
            h3({style: sectionTitle, className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, ['Library Cards']),
            div({style: sectionBody}, [
              p({style: paragraph}, ['Currently, when a researcher makes a data access request they are not only required to obtain approval from the data access committee (DAC) which oversees the data, but also from their home instiution\'s Signing Official, who approves their request and acknowledges the acceptance of organizational liability in the case of data misuse.']),
              img({
                src: '/images/signing_official_approval.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Signing Officials approve DARs',
                style: imageWrapper
              }),
              p({style: paragraph}, ['Estimates show Signing Officials were required to approve at least 50,000 DARs in 2019 in the US. Based on feedback from numerous Signing Officials we understand Signing Officials primary concern in the approval of data access requests (DARs) to be primarily an endorsement or authorization of the researcher, rather than the proposed research.']),
              p({style: paragraph}, ['To alleviate this burden on Signing Officials, DUOS is offering Signing Officials the opportunity to pre-authorize researchers to submit DARs to DACs using DUOS, via our DUOS Library Card Agreement.']),
              img({
                src: '/images/signing_official_preauthorize.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Alleviate burden on Signing Officials',
                style: imageWrapper
              }),
              p({style: paragraph}, ['This agreement allows a Signing Official to pre-authorize researchers from their institutions for a 1 year renewable term.']),
              div({style: {marginTop: '2rem', marginBottom: '2rem'}},
                [a({
                  id: 'link_downloadAgreement',
                  href: LibraryCardAgreement,
                  target: '_blank',
                  className: 'btn-secondary btn-download-pdf hover-color',
                  style: {paddingBottom: '1rem'},
                }, [
                  span({className: 'glyphicon glyphicon-download'}),
                  'Download DUOS Library Card Agreement'])
                ]),
              div({style: {fontWeight: 600}}, [
                p({style: paragraph}, ['To issue your researchers this Library Card pre-authorization, please sign and send the DUOS Library Card Agreement (above) along with a list of the first and last name, and eRA Commmons ID of each researcher you will issue this privilege, to: ',
                  h(Mailto, {email: 'DUOS-support@broadinstitute.zendesk.com'})
                ]),
              ]),
              p({style: {...paragraph, marginTop: '2rem', marginBottom: '2rem'}}, ['Please note, this agreement is non-negotiable.'])
            ])
          ]),
          div({style: sectionWrapper}, [
            h3({style: sectionTitle, className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, ['Signing Official FAQs']),
            div({style: sectionWrapper}, [
              h3({style: faqTitle}, ['What is a Library Card?']),
              div({style: sectionBody}, [
                p({style: paragraph}, ['A Library Card is a type of data access agreement which allows an institutional Signing Official to pre-authorize researchers to submit data access requests directly to a specified data access committee without further review by the Signing Official, expediting DAR turnaround time.'])
              ]),
            ]),
            div({style: sectionWrapper}, [
              h3({style: faqTitle}, ['How do I issue or remove a Library Card for one of my researchers?']),
              div({style: sectionBody}, [
                p({style: paragraph}, ['Currently, you must send a signed Library Card Agreement to duos-support@broadinstitute.zendesk.com to notify them of your institution and provide the name, email address, and eRA Commons ID of the researcher(s) for whom you would like to issue or remove Library Cards.'])
              ]),
            ]),
            div({style: sectionWrapper}, [
              h3({style: faqTitle}, ['How and when do I need to renew my institution\'s Library Cards?']),
              div({style: sectionBody}, [
                p({style: paragraph}, ['The DUOS team will contact each Signing Official to request an annual renewal of their issued Library Cards on July 1st of each year, starting in 2021.'])
              ]),
            ])
          ]),
        ])
      ])
    );
  }
}

export default HomeSigningOfficial;
