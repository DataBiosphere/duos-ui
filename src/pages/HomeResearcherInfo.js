import {Component} from 'react';
import {div, h1, h3, a, p, span, h} from 'react-hyperscript-helpers';
import Mailto from 'react-protected-mailto';

class HomeResearcherInfo extends Component {

  render() {

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

      div({className: 'row'}, [
        div({className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12'}, [
          div({style: sectionWrapper}, [
            h1({style: header}, ['DUOS for Researchers']),
            div({style: sectionWrapper}, [
              h3({style: sectionTitle}, ['Making sure researchers can access the right data, right away']),
              div({style: sectionBody}, [
                p({style: paragraph}, ['Currently, researchers submit over 100,000 data access requests per year to data access committees across the globe. With the amount of researchers, research tools, and data rapidly increasing the demand for data and on data access committees is becoming unmanageable - meaning slow turnaround times for researchers on their data access requests.']),
                p({style: paragraph}, ['DUOS aims to solve this problem by creating a single interface by which researchers can submit requests to multiple DACs around the world, instead of going through a unique process for each data access committee. With DUOS’ additional tools for data access committees, DUOS is rapidly decreasing the turnaround time - helping researchers access more data, faster, and with less effort.'])
              ])
            ]),
            div({style: sectionWrapper}, [
              h3({style: sectionTitle}, ['Researcher FAQs']),
              div({style: sectionWrapper}, [
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['How do I make a data access request in DUOS?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['If you have not yet registered with DUOS, please make sure to do so via the DUOS homepage. Once registered, you can proceed to the DUOS Dataset Catalog to search for and identify the datasets you would like to request, then select them and click the ‘Apply for Access’ button. You will then be taken to the Data Access Request Application workflow in DUOS. Please fill out the form as directed and click ‘Submit’ when finished. You will be able to monitor the status of your DAR via your Researcher Console page.'])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['Do I have to be a PI to apply for access to data via DUOS?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['No, you do not need to be a PI however you do need to have a Library Card (permission) issued to you by your institution’s Signing Official.'])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['Do I need an eRA Commons account to apply for access, and how do I get one?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['Yes, you must have an eRA Commons account in order to request access to data via DUOS. If you do not have an eRA Commons, and would like to obtain one please follow the NIH instructions here:']),
                    span({}, [
                      a({
                        href: 'https://grants.nih.gov/grants/how-to-apply-application-guide/prepare-to-apply-and-register/registration/investigators-and-other-users/era-commons-user-registration.htm',
                        target: '_blank'
                      }, ['https://grants.nih.gov/grants/how-to-apply-application-guide/prepare-to-apply-and-register/registration/investigators-and-other-users/era-commons-user-registration.htm'])
                    ])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['How long will it take for my data access request to be approved?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['Each DAC in DUOS is self-managed, meaning researchers may experience different average turnaround times from each DAC. DUOS’ aim is to decrease turnaround time as much as possible, while ensuring a thorough DAR review.'])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['If I am approved for access, where and how do I access the data?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['Each DAC may store their data in different locations, however much of the data accessible via DUOS is available in Terra. Instructions on how to access data and and data access permissions will be shared with researchers once approved by the DAC in DUOS. For questions or issues on accessing data via Terra please see the Terra support documentation, or reach out to the support team directly at ',
                      h(Mailto, {email: 'terra-support@broadinstitute.zendesk.com'}),
                      '.'
                    ])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['I am having issues accessing data I was approved for via Terra. What do I do?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['If you are having issues with accessing the data and have already been granted access by the Data Custodian, please reach out Terra customer support at ',
                      h(Mailto, {email: 'terra-support@broadinstitute.zendesk.com'}),
                      '. If you believe you have not yet been granted access to the data for which you are approved, please reach out to the Data Custodian listed for the respective datasets in the DUOS Dataset Catalog.'])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['I received a DAR approval email from DUOS, but I have not received access to data. What do I do?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['If you are having issues with accessing the data and have already been granted access by the Data Custodian, please consider reaching out to the system administrator of the repository in which the data is stored. For DUOS datasets stored in Terra, you can reach the Terra customer support at ',
                      h(Mailto, {email: 'terra-support@broadinstitute.zendesk.com'}),
                      '. If you believe you have not yet been granted access to the data for which you are approved, please reach out to the Data Custodian listed for the respective datasets in the DUOS Dataset Catalog.'])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['How do I grant access to my lab staff after being approved for access to data?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['Subsequent access grants to lab staff members depend upon the repository in which the data is stored. For information on how to share access permissions with colleagues in Terra, contact Terra support at ']),
                    h(Mailto, {email: 'terra-support@broadinstitute.zendesk.com'}),
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['I have accessed the data I was approved for, but I believe is an issue with it (ex. missing or incorrectly formatted data). What do I do?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['Please contact the Data Custodian listed for the dataset(s) in the DUOS Dataset Catalog.'])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['Why was my data access request denied?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['Most often, this occurs when the proposed research is not permitted by the data use limitations on the dataset(s). Please note, each DAC in DUOS is self-managed and DUOS is not permitted to share results or comments to researchers beyond what is provided to the researcher by the DAC. In the near future, DACs will have the option of providing comments to the researcher when conveying a DAR decision.'])
                  ]),
                ]),
                div({style: sectionWrapper}, [
                  h3({style: faqTitle}, ['I am a member of the same institution which manages access to a dataset. Do I still need to submit a data access request?']),
                  div({style: sectionBody}, [
                    p({style: paragraph}, ['This varies by institution. We suggest that you reach out to the internal colleagues who are the Data Custodians for the dataset(s) and/or your institution’s Signing Official to determine the answer to this question.'])
                  ]),
                ]),
              ]),
            ])
          ])
        ])
      ])
    );
  }
}

export default HomeResearcherInfo;
