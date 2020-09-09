import { Component } from 'react';
import { a, div, h1, h3, p, img } from 'react-hyperscript-helpers';

class HomeSigningOfficial extends Component {

  render() {
    return (
      div({}, [
        h1({}, ['DUOS for Signing Officials']),
        div({}, [
          h3({}, ['Library Cards']),
          p({}, ['Currently, when a researcher makes a data access request they are not only required to obtain approval from the data access committee (DAC) which oversees the data, but also from their home instiution\'s Signing Official, who approves their request and acknowledges the acceptance of organizational liability in the case of data misuse.']),
          img(),
          p({}, ['Estimates show Signing Officials were required to approve at least 50,000 DARs in 2019 in the US. Based on feedback from numerous Signing Officials we understand Signing Officials primary concern in the approval of data access requests (DARs) to be primarily an endorsement or authorization of the researcher, rather than the proposed research.']),
          p({}, ['To alleviate this burden on Signing Officials, DUOS is offering Signing Officials the opportunity to pre-authorize researchers to submit DARs to DACs using DUOS, via our DUOS Library Card Agreement.']),
          img({}),
          p({}, ['This agreement allows a Signing Official to pre-authorize researchers from their institutions for a 1 year renewable term.']),
          a({}, []),
          p({}, ['To issue your researchers this Library Card pre-authorization, please sign and send the DUOS Library Card Agreement (above) along with a list of the first and last name, and eRA Commmons ID of each researcher you will issue this privilege, to: moc.ksednez.etutitsnidaorb@troppus-SOUD\n' +
          'Please note, this agreement is non-negotiable.'])
        ]),
        div({}, [
          h3({}, ['Signing Official FAQs']),
          div({}, [
            div({}, [
              h3({}, ['What is a Library Card?']),
              p({}, ['A Library Card is a type of data access agreement which allows an institutional Signing Official to pre-authorize researchers to submit data access requests directly to a specified data access committee without further review by the Signing Official, expediting DAR turnaround time.'])
            ]),
            div({}, [
              h3({}, ['How do I issue or remove a Library Card for one of my researchers?']),
              p({}, ['Currently, you must write to duos-support@broadinstitute.zendesk.com to notify them of your institution and provide the name, email address, and eRA Commons ID of the researcher(s) for whom you would like to issue or remove Library Cards.'])
            ]),
            div({}, [
              h3({}, ['How and when do I need to renew my institution\'s Library Cards?']),
              p({}, ['The DUOS team will contact each Signing Official to request an annual renewal of their issued Library Cards on July 1st of each year, starting in 2021.'])
            ])
          ])
        ]),
      ])
    )
  }

}

export default HomeSigningOfficial;