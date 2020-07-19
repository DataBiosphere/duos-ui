import { Component } from 'react';
import { div, hr, h1, h3, p } from 'react-hyperscript-helpers';

// export const HomeAbout = hh(
class FAQs extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
  }

  render() {

    return (
      div({className: 'row home'}, [
        div(
          {className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12'},
          [
            h1({className: 'home-title'}, ['Frequently Asked Questions (FAQs)']),
            hr({className: 'home-line'}),
            div({className: 'home-sections home-sections-table'}, [
              div({className: 'home-sections-title'}, [


                h3({}, ['Why DUOS & Library Cards?']),
                div({className: 'home-content'}, [
                  p({},
                    ['The current data access request (DAR) process for controlled-access data has obvious bottlenecks. Delays are incurred by unnecessary, repetitious burdens put on Signing Officials and further exacerbated by providing data access committees (DACs) with ambiguous and non-compatible terms which they are obligated to interpret and evaluate to maintain compliance.']),
                  p({},
                    ['DUOS aims to reduce the DAR turnaround time for researchers, while enhancing the thoroughness of a DAC’s DAR review while simplifying the process. ']),
                  p({},
                    ['Library Cards are meant to change what are now repetitive 5-10 minute tasks done daily or weekly by Signing Officials, and change them to a once annual review of a list of authorized researchers. ']),
                ]),

                h3({}, ['What is DUOS?']),
                div({className: 'home-content'}, [
                  p({},
                    ['DUOS enables a researcher to submit a single request for multiple datasets to multiple data access requests, and those data access committees to review these requests and provide a response to the researchers. In this process, DUOS also codifies researchers’ requests and datasets’ data use limitations to make requests more decipherable both to DACs and DUOS’ matching algorithm, expediting DAR turnaround time.']),
                ]),

                h3({}, ['What is a Library Card?']),
                div({className: 'home-content'}, [
                  p({},
                    ['A Library Card is a type of data access agreement which allows an institutional Signing Official to pre-authorize researchers to submit data access requests directly to a specified data access committee without further review by the Signing Official, expediting DAR turnaround time.']),
                ]),

                h3({}, ['How do I make a data access request in DUOS?']),
                div({className: 'home-content'}, [
                  p({},
                    ['If you have not yet registered with DUOS, please make sure to do so via the DUOS homepage. Once registered, you can proceed to the DUOS Dataset Catalog to search for and identify the datasets you would like to request, then select them and click the ‘Apply for Access’ button. You will then be taken to the Data Access Request Application workflow in DUOS. Please fill out the form as directed and click ‘Submit’ when finished. You will be able to monitor the status of your DAR via your Researcher Console page.']),
                ]),

                h3({}, ['Does DUOS automate data access requests?']),
                div({className: 'home-content'}, [
                  p({},
                    ['No, DUOS does not automate data access requests. DUOS’ matching algorithm would easily allow for data access request review to be automated and instantaneous, and we are testing the algorithm with multiple DACs to see if and how this may be possible. Currently, DACs use the DUOS matching algorithm for decision support in their DAR reviews. As community confidence in the matching algorithm grows, we will allow each DAC to control if and when they automate their DARs via DUOS.']),
                ]),

                h3({}, ['What is the difference between a Library Card, a Passport, and a Visa?']),
                div({className: 'home-content'}, [
                  p({},
                    ['The Global Alliance for Genomics and Health released a technical specification for GA4GH Passports and Visas. Passports are a digital representation of a researcher’s identity, which may be composed of multiple unique attributes about the researcher. These respective digital researcher attributes are called Visas and the aggregate sum of the Visas are a researcher’s Passport, according to the GA4GH technical specification.']),
                  p({},
                    ['The Library Card on the other hand is not a digital or technical specification, but rather a policy and/legal agreement which can assert permissions to researchers.']),
                  p({},
                    ['These concepts may come together in that a researcher may be issued Library Card permissions which could be represented technically as a Visa on a researcher’s Passport. ']),
                ]),

                h3({}, ['Can my DAC use DUOS?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Yes! If you and/or your DAC is interested in using DUOS, please reach out to use at duos-support@broadinstitute.zendesk.com.']),
                ]),

                h3({}, ['If my DAC wants to use DUOS, does my data have to be in a specific system?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Nope! Any dataset may be registered in DUOS, regardless of the physical location of the data. Data Custodians and DACs interested in using DUOS are responsible for making sure researchers approved for access via DUOS are able to access the data once approved.']),
                ]),

                h3({}, ['How do I determine the data use limitations for my dataset(s)?']),
                div({className: 'home-content'}, [
                  p({},
                    ['DUOS is actively developing a tool to enable you to determine your datasets’ data use limitations according to the GA4GH Data Use Ontology, which we aim to make publicly available in 2020. For further assistance, our experienced and expert team is glad to consult with anyone needing guidance in assigning data use limitations to their datasets.']),
                ]),

                h3({}, ['Does DUOS store genetic data?']),
                div({className: 'home-content'}, [
                  p({},
                    ['No. DUOS only enables the metadata you see displayed in the DUOS Dataset Catalog to be stored in DUOS. All genetic data which may be requested via DUOS is stored in external systems, and predominantly in Broad’s Terra service, though use of Terra is not required for DACs to register their data in DUOS.']),
                ]),

                h3({}, ['If I make my data available via DUOS, does it need to be located in a single location?']),
                div({className: 'home-content'}, [
                  p({},
                    ['No. However, the Data Custodian for your dataset(s) will be responsible for providing access to researchers approved by the DAC and having data in multiple locations will be increasingly complex for Data Custodians to set and maintain access permissions, and for researchers to access and analyze the data in aggregate.']),
                ]),

                h3({}, ['Can DUOS allow for multiple parties to review and approve a data access request?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Yes. There are two ways to enable multiple individuals to review a DAR in DUOS.']),
                  p({},
                    ['One option is to add multiple individuals to your DAC, as DAC Members. DAC Members are able to offer comments and a suggested vote to the DAC Chair, without directly controlling the final vote on the DAR. This option is most helpful for individuals who are in the same organization, consortium, or collaborate with one another. ']),
                  p({},
                    ['Another option is to set a Data Owner for a dataset. In the case of a DAR approval by the DAC, a notification goes to a Data Owner for them to review the DAR and either approve or deny the DAR themselves. This option is most helpful for separate organizations to clearly delineate each group’s responsibilities and authority.']),
                ]),

                h3({}, ['Do I have to be a PI to apply for access to data via DUOS?']),
                div({className: 'home-content'}, [
                  p({},
                    ['No, you do not need to be a PI however you do need to have a Library Card (permission) issued to you by your institution’s Signing Official. ']),
                ]),

                h3({}, ['Do I need an eRA Commons account to apply for access, and how do I get one?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Yes, you must have an eRA Commons account in order to request access to data via DUOS. If you do not have an eRA Commons, and would like to obtain one please follow the NIH instructions here: https://grants.nih.gov/grants/how-to-apply-application-guide/prepare-to-apply-and-register/registration/investigators-and-other-users/era-commons-user-registration.htm']),
                ]),

                h3({}, ['How long will it take for my data access request to be approved?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Each DAC in DUOS is self-managed, meaning researchers may experience different average turnaround times from each DAC. DUOS’ aim is to decrease turnaround time as much as possible, while ensuring a thorough DAR review. ']),
                ]),

                h3({}, ['If I am approved for access, where and how do I access the data?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Each DAC may store their data in different locations, however much of the data accessible via DUOS is available in Terra. Instructions on how to access data and and data access permissions will be shared with researchers once approved by the DAC in DUOS. For questions or issues on accessing data via Terra please see the Terra support documentation, or reach out to the support team directly at terra-support@broadinstitute.zendesk.com ']),
                ]),

                h3({}, ['I am having issues accessing data I was approved for via Terra. What do I do?']),
                div({className: 'home-content'}, [
                  p({},
                    ['If you are having issues with accessing the data and have already been granted access by the Data Custodian, please reach out Terra customer support at terra-support@broadinstitute.zendesk.com. If you believe you have not yet been granted access to the data for which you are approved, please reach out to the Data Custodian listed for the respective datasets in the DUOS Dataset Catalog.']),
                ]),

                h3({}, ['I received a DAR approval email from DUOS, but I have not received access to data. What do I do?']),
                div({className: 'home-content'}, [
                  p({},
                    ['If you are having issues with accessing the data and have already been granted access by the Data Custodian, please consider reaching out to the system administrator of the repository in which the data is stored. For DUOS datasets stored in Terra, you can reach the Terra customer support at terra-support@broadinstitute.zendesk.com.']),
                  p({},
                    ['If you believe you have not yet been granted access to the data for which you are approved, please reach out to the Data Custodian listed for the respective datasets in the DUOS Dataset Catalog. ']),
                ]),

                h3({}, ['How do I grant access to my lab staff after being approved for access to data?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Subsequent access grants to lab staff members depend upon the repository in which the data is stored. For information on how to share access permissions with colleagues in Terra, contact Terra support at terra-support@broadinstitute.zendesk.com']),
                ]),

                h3({}, ['I have accessed the data I was approved for, but I believe is an issue with it (ex. missing or incorrectly formatted data). What do I do?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Please contact the Data Custodian listed for the dataset(s) in the DUOS Dataset Catalog.']),
                ]),

                h3({}, ['Why was my data access request denied?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Most often, this occurs when the proposed research is not permitted by the data use limitations on the dataset(s). Please note, each DAC in DUOS is self-managed and DUOS is not permitted to share results or comments to researchers beyond what is provided to the researcher by the DAC. In the near future, DACs will have the option of providing comments to the researcher when conveying a DAR decision.']),
                ]),

                h3({}, ['I am a member of the same institution which manages access to a dataset. Do I still need to submit a data access request?']),
                div({className: 'home-content'}, [
                  p({},
                    ['This varies by institution. We suggest that you reach out to the internal colleagues who are the Data Custodians for the dataset(s) and/or your institution’s Signing Official to determine the answer to this question.']),
                ]),

                h3({}, ['How do I issue or remove a Library Card for one of my researchers?']),
                div({className: 'home-content'}, [
                  p({},
                    ['Currently, you must write to duos-support@broadinstitute.zendesk.com to notify them of your institution and provide the name, email address, and eRA Commons ID of the researcher(s) for whom you would like to issue or remove Library Cards. ']),
                ]),
                h3({}, ['How and when do I need to renew my institution\'s Libray Cards?']),
                div({className: 'home-content'}, [
                  p({},
                    ['The DUOS team will contact each Signing Official to request an annual renewal of their issued Library Cards on July 1st of each year, starting in 2021.']),
                ]),
              ]),
            ]),
          ]),
      ])
    );
  }
}

export default FAQs;
