import { Component } from 'react';
import { div, h, hr, h1, h3, p, span, img } from 'react-hyperscript-helpers';

// export const HomeAbout = hh(
class NHGRIpilotinfo extends Component {

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
            h1({className: 'home-title'}, ['NHGRI AnVIL Data Access Pilot with DUOS & Library Cards']),
            hr({className: 'home-line'}),
            div({className: 'home-sections home-sections-table'}, [
              img({
                src: '/images/home_icon_about.svg',
                className: 'home-sections-icon',
                alt: 'About icon',
              }),
              div({className: 'home-sections-title'}, [
                h3({}, ['Background']),
                div({className: 'home-content'}, [
                  p({},
                    ['The NHGRI Genomic Data Science Analysis, Visualization, and Informatics Lab-space (AnVIL) is piloting a new method for researchers to request access to controlled-access genomic data.']),
                  p({},
                    ['Currently, when a researcher makes a data access request, they are not only required to obtain approval from the data access committee (DAC) which oversees the data, but also from their home instiution\'s Signing Official, who approves their request and acknowledges the acceptance of organizational liability in the case of data misuse. Estimates show Signing Officials were required to approve at least 50,000 DARs in 2019 in the US. Based on feedback from numerous Signing Officials we understand Signing Officials primary concern in the approval of data access requests (DARs) to be primarily an endorsement or authorization of the researcher, rather than the proposed research.']),
                  p({},
                    ['To alleviate this burden on Signing Officials and expedite the process for accessing controlled-access genomic data for trusted researchers, NHGRI is piloting the Library Card concept, which allows Signing Officials (SOs) to pre-approve researchers’ genomic Data Access Requests (DARs) for a 1-year, renewable term, referred to as issuing researchers a Library Card. DARs from researchers approved for Library Card access will be evaluated and approved by the NHGRI Data Access Committee (DAC) through the DUOS interface. Institutions participating in this pilot will also be testing a new process of accessing datasets in the database of Genotypes and Phenotypes (dbGaP) or AnVIL via the Data Use Oversight System (DUOS).']),
                ]),

                div({className: 'home-content'}, [
                  h3({}, ['Instructions for Researchers']),
                  p({style: {fontWeight: '500'}},
                    ['How do I obtain a Library Card?']),
                  p({},
                    ['To obtain a Library Card, you will need your Signing Official to approve you via the process highlighted in the ‘Instructions for Signing Officials’ below. To confirm if you have been issued a Library Card, you can check Your Profile in DUOS, where they will be displayed.']),
                  p({style: {fontWeight: '500'}},
                    ['How do I request access to genomic data via DUOS?']),
                ]),

                p({}, [
                  'First, you will need to identify the datasets you would like to request via the DUOS Dataset Catalog. Select the datasets you would like to request, and click ‘Apply for Access’. You will then be taken to the DUOS Data Access Request (DAR) Application. Complete the necessary fields on all steps of the application, making sure to read the Data Use Certification and Code of Conduct, and reviewing the data use limitations for the datasets you request. You will be required to have a Library Card issued by your Signing Official in order to submit your DAR. When ready, you can click ‘Submit’ and your DAR will be sent to the appropriate data access committee(s). You will be able to track the status of your DAR via your DUOS Researcher Console.',
                p({}, [
                  'Please note,  in addition to submitting your DAR via DUOS, for the near-term you will also be required to submit your DAR via the standard dbGAP DAR processes with the same DAR information including a matching request for the same datasets.']),


                  div({className: 'home-content'}, [
                    h3({}, ['Instructions for Signing Officials (SOs)']),
                    p({},
                      ['SOs interested in participating in the NHGRI pilot should email nhgridac@mail.nih.gov. Participating SOs will be sent a Library Card Agreement, which provides details on how this initiative enables SOs to pre-authorize researchers to submit DARs for NHGRI-managed datasets (e.g., GTEx, CCDG datasets, etc.) to the NHGRI DAC via DUOS. The Library Card will remain in place for one year, and DARs submitted through DUOS will not need to be approved individually for PIs with a Library Card. The goal of the pilot is to reduce the administrative burden on SOs and accelerate the controlled-data access process for investigators.']),
                    p({},
                      ['To issue this Library Card privilege to researchers, SOs participating in the pilot must provide a list of approved investigators and their corresponding IT Director to the NHGRI DAC Chair via email (nhgridac@mail.nih.gov). Approved investigators must be permanent employees of their institution at a level equivalent to a tenure-track professor or senior scientist with responsibilities that most likely include laboratory administration and oversight and should have an eRA Commons account. The IT Director is a person who has institutional (and not just department) authority to confirm that your institution has the capacity to protect shared data, and will comply with the NIH Genomic Data Sharing Policy. He/she should have a background in computer security and should not be the same person as the PI, any of the collaborators, the Signing Official, or the IRB review board. For example, an institution\'s Chief Information Officer would be appropriate. The pre-authorization of a researcher to submit DARs to the NHGRI DAC is valid for up to one year and is revocable by the SO at any time. NHGRI will ask institutions to review and confirm their institution’s list of researchers issued a Library Card annually. To revoke a researcher’s Library Card privileges, the SO must send an email to the NHGRI DAC Chair. [if needed] The initial pilot will require submission of a DAR to both dbGaP and DUOS and will later transition to a single submission through DUOS. The current process of SOs approving individual DARs will also still be available via dbGaP throughout this pilot program.']),
                  ]),
                ]),
              ]),
            ]),
          ]),
      ])
    );
  }
}

export default NHGRIpilotinfo;
