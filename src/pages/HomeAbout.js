import { Component } from 'react';
import { div, hr, h1, h3, br, p, img } from 'react-hyperscript-helpers';

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
          div({ className: "home-title-description" }, ["A semi-automated management service for compliant secondary use of human genomics data"]),
          hr({ className: "home-line" }),
          div({ className: "home-sections home-sections-table" }, [
            img({ src: "/images/home_icon_about.svg", className: "home-sections-icon", alt: "About icon" }),
            div({ className: "home-sections-title" }, [
              h3({}, ["About"]),
              p({ className: "home-sections-description" }, ["Overview of the system and development"]),
              div({ className: "home-content" }, [
                p({}, ["Increasingly, a major challenge to data sharing is navigating the complex web of restrictions on secondary data use. Human subjects datasets often have restrictions such as “only available for cancer use” or “only available for the study of pediatric diseases,” deduced from the original biospecimen collection consent form, which must be respected when accessing data. So far, these data use restrictions have not yet been made machine readable, requiring the investment of significant human effort to enable researchers to reuse data."]),
                p({}, ["As part of our efforts to enhance collaborative research, the Broad Institute has recently developed the “Data Use Oversight System” which is its first attempt to semi-automate and efficiently manage sharing of human subjects datasets. The goal of this system is to ensure that data use restrictions are respected while also efficiently enabling appropriate data reuse."]),
                p({}, ["The development of this system stemmed from the experience of the Broad’s Office of Research Subject Protection, project management teams, and researchers at Broad in sharing and reusing human subjects data as part of large scale aggregation efforts. One such example is the Exome Aggregation Consortium (ExAC) in which 26 researchers collaborated and shared over 80 human subjects datasets to perform aggregated analysis of >90K exomes, resulting in a valuable resource for clinical interpretation of genomic data . A major challenge to that effort, however, was managing secondary data use restrictions; data use oversight across dozens of datasets is not automated and does not scale."]),
                p({}, ["To overcome this challenge and enable efficient discovery and reuse of existing human subjects datasets in future projects, we developed a software service that attempts to mimic, in an automated fashion, the data oversight process currently in place at dbGAP. To this end, the system includes interfaces to capture and transform data use restrictions and data access requests to machine readable consent codes ( MRCC; most of which are included in Dyke et al. 2015 ) . These codes were defined based on reviewing ~200 data use restrictions at Broad. The system triggers a matching algorithm that uses Web Ontology Language (OWL) and the MRCC to reason whether data access should be granted given the research purpose and the data restrictions.. The algorithm also identifies cases where manual review by a data access committee (DAC) is required. It automatically triggers this process and provides interfaces for the DAC to efficiently evaluate data access requests online."]),
                p({}, ["To evaluate the feasibility of using consent codes to manage secondary data use restrictions, we recently launched a pilot trial of the system that is overseen by Partners’ Healthcare IRB. During this pilot, a DAC comprised of experts in data use oversight (from the NIH, Partners’ IRB, Sage Bionetworks and Broad) will evaluate data access requests in parallel with our system. This will allow us to improve the algorithm and the consent codes using experts’ feedback."])
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default HomeAbout;
