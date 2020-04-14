import { Component } from 'react';
import { a, div, h, hr, h1, h3, p, span, img } from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';

// export const HomeAbout = hh(
class HomeAbout extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  render() {

    return (
      div({ className: "row home" }, [
        div({ className: "col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h1({ className: "home-title" }, ["Data Use Oversight System"]),
          hr({ className: "home-line" }),
          div({ className: "home-sections home-sections-table" }, [
            img({ src: "/images/home_icon_about.svg", className: "home-sections-icon", alt: "About icon" }),
            div({ className: "home-sections-title" }, [
              h3({}, ["DUOS"]),
              p({ className: "home-sections-description" }, ["A semi-automated management service for compliant secondary use of human genomics data"]),
              div({ className: "home-content" }, [
                p({}, ["Increasingly, a major challenge to data sharing is navigating the complex web of restrictions on secondary data use. Human subjects datasets often have complex and/or ambiguous restrictions on future use deduced from the original consent form, which must be respected when utilizing data. Previously, such data use restrictions were uniquely drafted across institutions, creating vast inconsistencies and requiring the investment of significant human effort to determine if researchers should be permitted to use the data."]),
                p({}, ["As part of our efforts to enhance collaborative research, the Broad Institute developed the “Data Use Oversight System” (DUOS) to semi-automate and efficiently manage compliant sharing of human subjects data. DUOS' objective is two-fold, to enhance data access committee's confidence that data use restrictions are respected while efficiently enabling appropriate data access."]),
                p({}, ["To better enable the use of existing human subjects datasets in future projects, DUOS mimics, in a semi-automated fashion, the data access request review processes common to DACs globally, like those in dbGaP. To this end, the system includes interfaces to capture and structure data use restrictions and data access requests as machine-readable data use terms based on the GA4GH's Data Use Ontology. With these machine-readable terms for dataset's use limitations and data access requests established, DUOS is able to trigger a matching algorithm to reason if data access should be granted given the research purpose and the data restrictions, serving as a decision support tool for DACs using DUOS."]),
                p({}, ["To evaluate the feasibility of using machine readable data use terms to interpret data use restrictions and access requests, we are piloting a trial of DUOS overseen by Partners’ Healthcare IRB. During the pilot, DACs comprised of governmental and non-governmental data custodians will pilot the use of DUOS, its ability to structure use limitations and access requests, and the accuracy of the DUOS algorithm. This aids us in improving the DUOS algorithm and providing feedback on the GA4GH Data Use Ontology based on experts’ feedback."]),
              ]),

              div({ className: "home-content" }, [
                h3({}, ["Library Card"]),
                p({ className: "home-sections-description" }, ["An innovative and simplified approach to data access agreements"]),
                p({}, ["Currently, when a researcher makes a data access request they are not only required to obtain approval from the data access committee (DAC) which oversees the data, but also from their home instiution's Signing Official, who approves their request and acknowledges the acceptance of organizational liability in the case of data misuse. Estimates show Signing Officials were required to approve at least 50,000 DARs in 2019 in the US. Based on feedback from numerous Signing Officials we understand Signing Officials primary concern in the approval of data access requests (DARs) to be primarily an endorsement or authorization of the researcher, rather than the proposed research."]),
                img({ src: "/images/lc_only_process.png", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 home-content-graphic", alt: "About icon" }),
                p({}, ["To alleviate this burden on Signing Officials, DUOS is offering Signing Offficals the opportunity to pre-authorize researchers to submit DARs to DACs using DUOS, via our DUOS Library Card Agreement. This agreement allows a Signing Official to pre-authorize researchers from their instutions for a 1 year renewable term."]),
                div({ className: 'col-lg-12 col-md-12 col-md-12 col-md-12 rp-group' }, [
                  p({}, []),
                  a({
                    id: 'link_downloadAgreement', href: 'duos_librarycardagreementtemplate_3.28.20.pdf', target: '_blank',
                    className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color'
                  }, [
                    span({ className: 'glyphicon glyphicon-download' }),
                    'Download DUOS Library Card Agreement']),
                ]),
              ]),
                p({ style: { fontWeight: '500' } }, [
                  'To issue your researchers this Library Card pre-authorization, please sign and send the DUOS Library Card Agreement (above) along with a list of the first and last name, and eRA Commmons ID of each researcher you will issue this privilege, to: ',
                  h(Mailto, { email: 'DUOS-support@broadinstitute.zendesk.com' }),
                  p({ style: { fontWeight: '400' } }, ["Please note, this agreement is non-negotiable."]),

                div({ className: "home-content" }, [
                  h3({}, ["DUOS & Library Card"]),
                  p( { className: "home-sections-description" }, ["Bringing the two together for a data access revolution"]),
                  p( {style: { fontWeight: '400' }}, ["The current data access request process incurs delays from and unncessary burden on Signing Officials and is further slowed by providing data access committees (DACs) with ambiguous and non-compatible terms which they are obligated to interpret and evaluate to maintain compliance."]),
                  img({ src: "/images/duos_lc_process.png", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 home-content-graphic", alt: "About icon" }),
                  p( {style: { fontWeight: '450' }}, ["Combined, the DUOS Library Card Agreement and DUOS system significantly alleviate the burden of work on Signing Officials and DACs while enhancing their compliant function and expediting appropriate access for researchers. "]),
                ]),

                div({ className: "home-content" }, [
                  h3({}, ["Machine Readable Consent Forms & DUOS"]),
                  p( { className: "home-sections-description" }, ["Standardizing data sharing language for expedited and compliant sharing"]),
                  p( {style: { fontWeight: '400' }}, ["To date, many consent forms contain ambiguous or region-specific data sharing language, making widespread data sharing and aggregation of datasets difficult or near impossible."]),
                  span({}, []),
                  a({ href: 'https://blog.primr.org/is-your-data-sharing-consent-language-transparent-and-machine-readable/', target: '_blank' }, 'GA4GH\'s Machine Readable Consent Form Initiative'),
                  p( {style: { fontWeight: '400' }}, ["This initiative provides standard data sharing language for IRBs, funders, and investigators to use in their consent forms, based on the Data Use Ontology (DUO)."]),
                  img({ src: "/images/machine_readable_consent_forms.png", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 home-content-graphic", alt: "About icon" }),
                  p( {style: { fontWeight: '400' }}, ["By using these machine readable consent form clauses, IRBs, funders, and investigators establish how their dataset(s) may be used, specifically the data use limitations, according to the international DUO standard - removing the need for latter interpretation of the consent forms, and greatly aiding DACs in reviewing DARs for the dataset(s)."]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default HomeAbout;
