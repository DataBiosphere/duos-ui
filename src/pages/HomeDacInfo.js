import {Component} from 'react';
import {div, h1, h3, img, p, span} from 'react-hyperscript-helpers';

class HomeDacInfo extends Component {

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

    const sectionWrapper = {
      fontFamily: 'Montserrat',
      margin: '2rem auto',
      overflow: 'auto',
      textAlign: 'center',
      color: '#1F3B50',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    };

    const sectionTitle = {
      fontWeight: '600',
      color: '#2899BC',
      padding: '0 5rem'
    };

    const paragraph = {
      padding: '1rem 0 0 0'
    };

    return (

      div({className: 'row'}, [
        div({className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12'}, [
          div({style: sectionWrapper}, [
            h1({style: {fontWeight: 600}}, ['DUOS for DACs']),
            div({style: sectionWrapper}, [
              h3({style: sectionTitle}, ['DACs must answer important questions about access to data, but often have to interpret complex and ambiguous inputs to those decisions']),
              p({style: paragraph}, ['Currently, when DAC’s receive data access requests they must decide if the proposed research use is within the bounds of the data’s use limitations.']),
              p({style: paragraph}, ['Unfortunately, data use limitations are often described with unique language across the various consent forms in which they appear (diagram left). Thus a DAC is left to attempt to interpret either the consent form, or the receive the original IRB’s interpretation (ex. NIH Institutional Certification, Broad Data Use Letter) to determine the official use limitations.']),
              p({style: paragraph}, ['On the other hand (diagram right), researchers data access requests are often narrative scientific proposals of varying levels of depth and specificity as to the research proposed.']),
              p({style: paragraph}, ['The inconsistency and lack of clarity in the terms used to describe data use use limitations and research proposals makes it difficult for DACs to answer the question of ',
                span({style: {fontStyle: 'italics'}}, '“Is the proposed research within the bounds of the data use limitations?”')]),
              img({style: imageWrapper, src: '/images/about_current_access.png', alt: 'current access'}),
              p({style: paragraph}, ['To resolve this issue, the Global Alliance for Genomics and Health created a common vocabulary for data use limitations and proposed research, called the Data Use Ontology. The ontology is not only a standardized series of terms and definitions describing data use  but is also computer readable.']),
              p({style: paragraph}, ['DUOS leverages the Data Use Ontology by enabling Data Depositors to describe their data use limitations with DUO terms, and Researchers to describe their research purposes with DUO terms. The result is that DACs using DUOS can compare data use limitations and research purposes using the same vocabulary of terms.']),
              img({style: imageWrapper, src: '/images/about_dacs_algorithm.png', alt: 'algorithm'}),
              p({style: paragraph}, ['Additionally, with the use limitations and proposed research in DUO terms, DUOS can enable an algorithm to compute the comparison of the data use limitations and proposed research in an attempt to replicate the decision the DAC would make. Through testing, the DUOS algorithm has seen >90% agreement with DACs. Currently, DACs are able to leverage the algorithm as a decision-support tool, reviewing the DUOS algorithm’s suggested decision prior to logging their own decision. If the DUOS algorithm proves to consistently decide as the DAC would, DACs may choose to use the DUOS algorithm to automatically respond to data access requests.'])
            ]),
          ]),
          div({style: sectionWrapper}, [
            h3({style: sectionTitle}, ['DAC FAQs']),
            div({style: sectionWrapper}, [
              div({style: sectionWrapper}, [
                h3({}, ['Can my DAC use DUOS?']),
                p({style: paragraph}, ['Yes! If you and/or your DAC is interested in using DUOS, please reach out to use at duos-support@broadinstitute.zendesk.com.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['If my DAC wants to use DUOS, does my data have to be in a specific system?']),
                p({style: paragraph}, ['Nope! Any dataset may be registered in DUOS, regardless of the physical location of the data. Data Custodians and DACs interested in using DUOS are responsible for making sure researchers approved for access via DUOS are able to access the data once approved.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['How do I determine the data use limitations for my dataset(s)?']),
                p({style: paragraph}, ['DUOS is actively developing a tool to enable you to determine your datasets’ data use limitations according to the GA4GH Data Use Ontology, which we aim to make publicly available in 2020. For further assistance, our experienced and expert team is glad to consult with anyone needing guidance in assigning data use limitations to their datasets.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['Does DUOS store genetic data?']),
                p({style: paragraph}, ['No. DUOS only enables the metadata you see displayed in the DUOS Dataset Catalog to be stored in DUOS. All genetic data which may be requested via DUOS is stored in external systems, and predominantly in Broad’s Terra service, though use of Terra is not required for DACs to register their data in DUOS.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['If I make my data available via DUOS, does it need to be located in a single location?']),
                p({style: paragraph}, ['No. However, the Data Custodian for your dataset(s) will be responsible for providing access to researchers approved by the DAC and having data in multiple locations will be increasingly complex for Data Custodians to set and maintain access permissions, and for researchers to access and analyze the data in aggregate.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['Can DUOS allow for multiple parties to review and approve a data access request?']),
                p({style: paragraph}, ['Yes. There are two ways to enable multiple individuals to review a DAR in DUOS.']),
                p({style: paragraph}, ['One option is to add multiple individuals to your DAC, as DAC Members. DAC Members are able to offer comments and a suggested vote to the DAC Chair, without directly controlling the final vote on the DAR. This option is most helpful for individuals who are in the same organization, consortium, or collaborate with one another.']),
                p({style: paragraph}, ['Another option is to set a Data Owner for a dataset. In the case of a DAR approval by the DAC, a notification goes to a Data Owner for them to review the DAR and either approve or deny the DAR themselves. This option is most helpful for separate organizations to clearly delineate each group’s responsibilities and authority.'])
              ]),
              div({style: sectionWrapper}, [
                h3({}, ['Does DUOS automate data access requests?']),
                p({style: paragraph}, ['No, DUOS does not automate data access requests. DUOS’ matching algorithm would easily allow for data access request review to be automated and instantaneous, and we are testing the algorithm with multiple DACs to see if and how this may be possible. Currently, DACs use the DUOS matching algorithm for decision support in their DAR reviews. As community confidence in the matching algorithm grows, we will allow each DAC to control if and when they automate their DARs via DUOS.'])
              ]),
            ]),
          ])
        ])
      ])
    );
  }
}

export default HomeDacInfo;
