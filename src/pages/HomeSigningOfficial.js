import { Component } from 'react';
import { a, div, h, h1, h3, p, img, span } from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';

class HomeSigningOfficial extends Component {

  render() {

    const imageWrapper = {
      padding: '0 2rem',
      margin: '3rem 5rem 1rem',
      height: 'auto',
      width: '100%',
      float: 'none'
    }

    const sectionWrapper = {
      fontFamily: 'Montserrat',
      margin: '2rem auto',
      overflow: 'auto',
      textAlign: 'center',
      color: '#1F3B50',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }

    const sectionTitle = {
      fontWeight: '600',
      color: '#2899BC',
      padding: '0 5rem'
    }

    return (
      div({className: 'row home'}, [
        div({className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12'}, [
          div({style: sectionWrapper}, [
            h1({style: {fontWeight: 600}}, ['DUOS for Signing Officials'])
          ]),
          div({style: sectionWrapper}, [
            h3({style: sectionTitle}, ['Library Cards']),
            div({style: sectionWrapper}, [
              p({}, ['Currently, when a researcher makes a data access request they are not only required to obtain approval from the data access committee (DAC) which oversees the data, but also from their home instiution\'s Signing Official, who approves their request and acknowledges the acceptance of organizational liability in the case of data misuse.']),
              img({src: '/images/signing_official_approval.png',
                   className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                   alt: 'Signing Officials approve DARs',
                   style: imageWrapper
                  }),
              p({}, ['Estimates show Signing Officials were required to approve at least 50,000 DARs in 2019 in the US. Based on feedback from numerous Signing Officials we understand Signing Officials primary concern in the approval of data access requests (DARs) to be primarily an endorsement or authorization of the researcher, rather than the proposed research.']),
              p({}, ['To alleviate this burden on Signing Officials, DUOS is offering Signing Officials the opportunity to pre-authorize researchers to submit DARs to DACs using DUOS, via our DUOS Library Card Agreement.']),
              img({src: '/images/signing_official_preauthorize.png',
                   className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                   alt: 'Alleviate burden on Signing Officials',
                   style: imageWrapper
                  }),
              p({}, ['This agreement allows a Signing Official to pre-authorize researchers from their institutions for a 1 year renewable term.']),
              div({style: { marginTop: '2rem', marginBottom: '2rem' }},
                    [a({
                      id: 'link_downloadAgreement',
                      href: 'duos_librarycardagreementtemplate_rev_2020-04-14.pdf',
                      target: '_blank',
                      className: 'btn-secondary btn-download-pdf hover-color',
                      style: { paddingBottom: '1rem' },
                    }, [
                      span({className: 'glyphicon glyphicon-download'}),
                      'Download DUOS Library Card Agreement'])
                    ]),
              div({style: {fontWeight: 600}}, [
                p({}, ['To issue your researchers this Library Card pre-authorization, please sign and send the DUOS Library Card Agreement (above) along with a list of the first and last name, and eRA Commmons ID of each researcher you will issue this privilege, to: ']),
                h(Mailto, {email: 'moc.ksednez.etutitsnidaorb@troppus-SOUD'})
              ]),
              p({style: { marginTop: '2rem', marginBottom: '2rem' }}, ['Please note, this agreement is non-negotiable.'])
            ])
          ]),
          div({style: sectionWrapper}, [
            h3({style: sectionTitle}, ['Signing Official FAQs']),
              div({style: sectionWrapper}, [
                h3({}, ['What is a Library Card?']),
                p({}, ['A Library Card is a type of data access agreement which allows an institutional Signing Official to pre-authorize researchers to submit data access requests directly to a specified data access committee without further review by the Signing Official, expediting DAR turnaround time.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['How do I issue or remove a Library Card for one of my researchers?']),
                p({}, ['Currently, you must write to duos-support@broadinstitute.zendesk.com to notify them of your institution and provide the name, email address, and eRA Commons ID of the researcher(s) for whom you would like to issue or remove Library Cards.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['How and when do I need to renew my institution\'s Library Cards?']),
                p({}, ['The DUOS team will contact each Signing Official to request an annual renewal of their issued Library Cards on July 1st of each year, starting in 2021.'])
              ])
          ]),
        ])
      ])
    )
  }

}

export default HomeSigningOfficial;