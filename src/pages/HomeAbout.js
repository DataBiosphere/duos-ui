import {Component} from 'react';
import {div, h1, h3, p, img} from 'react-hyperscript-helpers';

class HomeAbout extends Component {

  render() {

    const imageWrapper = {
      padding: '5rem',
      margin: '0 3rem',
      height: 'auto',
      maxHeight: '300px',
      width: 'auto',
      maxWidth: '100%',
      float: 'none'
    }

    const aboutSectionWrapper = {
      fontFamily: 'Montserrat',
      margin: '2rem auto',
      overflow: 'auto',
      textAlign: 'center',
      color: '#1F3B50',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }

    const aboutSectionTitle = {
      fontWeight: '600',
      color: '#2899BC',
      padding: '0 5rem'
    }

    const aboutSectionBody = {
      padding: '0 5rem',
    }

    const paragraph = {
      padding: '1rem 0 0 0'
    }

    return (
      div({className: 'row home'}, [
        div({className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12'}, [
          div({}, [
            div({style: aboutSectionWrapper}, [
              h1({style: {fontWeight: '600'}}, ['Data Use Oversight System'])
            ]),
            div({style: aboutSectionWrapper}, [
              h3({style: aboutSectionTitle}, ['Current State of Data Access']),
              img({
                src: '/images/about_current_access.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Current state of data access',
                style: imageWrapper
              }),
              div({style: aboutSectionBody}, [
                p({style: paragraph},
                  ['Human subjects datasets often have complex and/or ambiguous restrictions on future use deduced from the original consent form, which must be respected when utilizing data.']),
                p({style: paragraph},
                  ['Previously, such data use restrictions were uniquely drafted across institutions, creating vast inconsistencies.']),
                p({style: paragraph},
                  ['On top of this, researchers submitting data access requests for this data have done with varying levels of clarity and specificity, and are delayed by needing to obtain their Signing Official’s approval prior to submitting their request. Unfortunately, a number of the world’s data access committees (DACs) which receive these requests do not have a standard approach for collecting this information, which leads to further ambiguity.']),
                p({style: paragraph},
                  ['The lack of consistent standards on both sides of this equation, requires the investment of significant human effort to determine if researchers should be permitted to use the data, which ultimately confuses and delays the data access request process, while the demand for data access requests increase exponentially.']),
                p({style: paragraph},
                  ['DUOS is working to improve this process, let us describe how.']),
                p({style: paragraph},
                  ['We will start on the left of our diagram...'])
              ]),
            ]),
            div({style: aboutSectionWrapper}, [
              h3({
                style: aboutSectionTitle,
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'
              }, ['Reducing the complexity of determining permitted uses of data from consent forms with machine readable codes']),
              img({
                src: '/images/about_reducing_complexity.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Reducing the complexity',
                style: imageWrapper
              }),
              div({style: aboutSectionBody}, [
                p({style: paragraph},
                  ['Let’s look at the present issue with consent forms.']),
                p({style: paragraph},
                  ['Most consent forms either contain unique, institution-specific language on data sharing or remain silent. Unfortunately, these uniquely written or silent consent provide DACs with little or difficult-to-interpret guidance on how data may be permissibly shared.']),
                p({style: paragraph},
                  ['To solve this issue, GA4GH’s Data Use and Researcher Identities (DURI) workstream created the Data Use Ontology (DUO), which is a structured and machine-readable vocabulary for defining terms of future data use and meant to provide a common standard for describing data sharing policies in consent forms. To facilitate the implementation of GA4GH’s DUO, the DURI workstream and GA4GH’s Regulatory and Ethics workstream (REWS) created the Machine Readable Consent Guidance (PDF). This guidance instructs IRBs and investigators on how to use DUO terms in consent forms in order to clearly describe the permitted uses of the data collected using the DUO standard.']),
                p({style: paragraph},
                  ['The Data Use Ontology is an official GA4GH standard now referenced by genomics repositories in over 15 countries, is actively being adopted in the drafting of numerous consent forms by IRBs and investigators, and is an integral element of the Data Use Oversight System (DUOS) software.'])
              ]),
            ]),
            div({style: aboutSectionWrapper}, [
              h3({
                style: aboutSectionTitle,
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'
              }, ['Making permitted data use clearer in consent forms through the GA4GH Data Use Ontology']),
              img({
                src: '/images/about_consent_ontology.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'GA4GH Data Use Ontology',
                style: imageWrapper
              }),
              div({style: aboutSectionBody}, [
                p({style: paragraph},
                  ['Once the consent forms clearly distinguish permitted uses of the data using machine readable DUO terms, the data can be tagged and stored with its appropriate DUO terms. This enables investigators desiring to access the data to know up front whether or not they are likely to be granted access. Furthermore, having clearly defined DUO terms for each dataset significantly facilitates the work of the DAC in determining if requests for the data are consistent with its permitted uses.'])
              ]),
            ]),
            div({style: aboutSectionWrapper}, [
              h3({
                style: aboutSectionTitle
              }, ['Clarity of permitted data use helps, but complexity still lies in free-text data access requests']),
              img({
                src: '/images/about_clarity_complexity.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Complexity still lies in free-text data access requests',
                style: imageWrapper
              }),
              div({style: aboutSectionBody}, [
                p({style: paragraph},
                  ['Having clearly defined DUO terms for each dataset significantly facilitates the work of the DAC in determining if requests for the data are consistent with its permitted uses.']),
                p({style: paragraph},
                  ['Yet, DACs are still left with multiple issues in receiving and reviewing data access requests.']),
                p({style: paragraph},
                  ['First, they are responsible for interpreting complex, domain-specific research proposals contained within each request which they must compare with the requested data’s permitted uses.']),
                p({style: paragraph},
                  ['Additionally, the DAC is responsible for assuring the legitimacy of a submitting researcher, and making sure they have appropriate institutional backing.']),
                p({style: paragraph},
                  ['Further, DACs and Signing Officials often sign and/or negotiate a unique data access agreement between their institutions for every single data access request submitted/approved.'])
              ]),
            ]),
            div({style: aboutSectionWrapper}, [
              h3({
                style: aboutSectionTitle,
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'
              }, ['A two-fold approach to improving data access requests: pre-authorizing researchers, and machine-readable access requests']),
              img({
                src: '/images/about_two_fold_approach.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Two-fold approach to improving data access requests',
                style: imageWrapper
              }),
              div({style: aboutSectionBody}, [
                p({style: paragraph},
                  ['The DUOS team is working actively on process, policy, and software improvements to reduce or remove each of these issues impact on research.']),
                p({style: paragraph},
                  ['To address the complexity of the domain-specific research proposals in each request, DUOS requires requesting investigators to structure their data access request using Data Use Ontology’s structured vocabulary.']),
                p({style: paragraph},
                  ['To assist with identifying the legitimacy of the researcher and the heavy administrative burden on Signing Officials, DUOS developed the Library Card Agreement (PDF) which is a single-signature, annually renewable data access agreement under which Signing Officials can pre-authorize any investigators from their institution to submit data access requests to any DAC using the DUOS system.'])
              ]),
            ]),
            div({style: aboutSectionWrapper}, [
              h3({
                style: aboutSectionTitle,
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12'
              }, ['Now DACs can compare permitted uses and access requests with enhanced clarity and efficiency']),
              img({
                src: '/images/about_dacs_compare.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Now DACs can compare',
                style: imageWrapper
              }),
              div({style: aboutSectionBody}, [
                p({style: paragraph},
                  ['With those improvements to the data access request process in place, DACs are then able to compare the permitted use of the data and the data access request both described in GA4GH Data Use Ontology terms. This significantly expedites the DACs review of a data access. On top of this, the Signing Official is no longer required to take part in the review and submission of each DAR, nor does a unique data access agreement need to be signed. Removing these elements of the process further expedites the process.'])
              ]),
            ]),
            div({style: aboutSectionWrapper}, [
              h3({style: aboutSectionTitle}, ['With both permitted uses and access requests in machine readable terms, an algorithm can offer suggested decisions to DACs']),
              img({
                src: '/images/about_dacs_algorithm.png',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
                alt: 'Algorithm can offer suggested decisions to DACs',
                style: imageWrapper
              }),
              div({style: aboutSectionBody}, [
                p({style: paragraph},
                  ['Having the permitted use of the data and the data access request both described in GA4GH Data Use Ontology terms, doesn’t just facilitate the DAC’s review - but given that the DUO terms are machine readable it means that we are able to use the DUOS algorithm to compare the permitted uses with the data access request instantly.']),
                p({style: paragraph},
                  ['Currently, DACs using DUOS are able to review the algorithm’s suggested decision on comparing the permitted uses with the data access request prior to logging their final decision on a request.'])
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default HomeAbout;
