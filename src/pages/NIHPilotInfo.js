import React from 'react';

export default function NIHPilotInfo() {
  return (
    <div className="row home">
      <div className="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12">
        <h1 className="home-title">NIH DUOS Pilot</h1>
        <hr className="home-line" />
        <div className="home-sections home-sections-table">
          <div className="home-sections-title">
            <h3>Background</h3>
            <div className="home-content">
              <p>
                The NIH is the largest biomedical research agency in the world and is the steward of a amassing number of controlled-access datasets and platforms at the forefront of data science for data research. NIH Data Access Committees (DACs) oversee access to these controlled-access datasets; they quickly assess whether researchers&apos; proposed research purpose is aligned with the appropriate data uses of each dataset. They play an important role in ensuring that data are used in a manner that is consistent with the informed consent of the study&apos;s participants. Though the NIH DACs are among some of the fastest in the world at making these important decisions about data access, growing demand for controlled-access datasets warrant development of new systems that retain sufficient oversight while enabling speedy decisions on access.
              </p>
              <p>
                Thus, under the auspices of the National Human Genome Research Institute&apos;s (NHGRI) Genomic Data Science Analysis, Visualization, and Informatics Lab-space (AnVIL) and with support from the Office of Data Science Strategy (ODSS), multiple data access committees (DACs) across the US National Institutes of Health (NIH) are piloting new, standards-based methods for facilitating access to controlled-access genomic data.
              </p>
              <p>
                The Data Use Oversight System (DUOS), built by the Broad Institute and informed by GA4GH and multiple NIH DACs, is a semi-automated data access management service which governs compliant secondary use of human genomics data. NHGRI, NHLBI, JAAMH, and NIAID Data Access Committees (DACs) will be testing active dbGaP requests for controlled-access genomic datasets to compare whether DUOS provides advantages to current methods for overseeing access.
              </p>
            </div>
            <div className="home-content">
              <h3>Milestones</h3>
              <div style={{ fontWeight: '500' }}>Integration of RAS - to begin Q2 2021</div>
              <div style={{ fontWeight: '500' }}>NIH DUOS Pilot Phase II - to begin Q1 2021</div>
              <p>
                Phase II of the NIH DUOS Pilot will include 4 DACs committees representing 7 NIH Institutes and Centers and include over 300 datasets.
              </p>
              <div style={{ fontWeight: '500' }}>NIH DUOS Pilot Phase I - Completed July 2020</div>
              <p>
                NHLBI and NHGRI tested DUOS with previous DARs and solicited feedback from multiple NIH stakeholders, and in turn suggested and guided improvements to DUOS.
              </p>
            </div>
            <div className="home-content">
              <h3>Related Information</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
