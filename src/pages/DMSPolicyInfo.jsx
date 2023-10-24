import { Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import React from 'react';
import homeHeaderBackground from '../images/home_header_background.png';
import anvilBackground from '../images/anvil_background.jpg';
import subtitleImageNih from '../images/duos_laptops.png';
import subtitleImageAnvil from '../images/anvil_laptops.png';
import storeDataImageNih from '../images/duos_chart.png';
import storeDataImageAnvil from '../images/anvil_data_store.png';
import shareDataImage from '../images/share_data.png';
import manageAccessImage from '../images/duos_manages_access.png';
import { Theme, Styles } from '../libs/theme';

import './DMSPolicyInfo.css';

const styles = {
  baseStyle: {
    color: Theme.palette.primary,
  },
  nihBackground: {
    backgroundImage: `url(${homeHeaderBackground})`,
  },
  anvilBackground: {
    backgroundImage: `url(${anvilBackground})`,
    backgroundPosition: '-2px -4px',
  },
};

function DMSPolicyInfo(props) {
  const {
    variant, // Variant can be NIH or ANVIL
  } = props;

  const renderSectionImage = (url, alt) => (
    <img src={url} alt={alt}/>
  );

  const renderInfoBox = (text, index) => (
    <div className="info-box" key={`${index}`}>
      <CheckCircleIcon htmlColor="#74ae43" fontSize='large'/>
      <div>
        {text}
      </div>
    </div>
  );

  // Background at the top of the page
  let backgroundStyle;
  // The image to use in the subtitle section
  let subtitleImage;
  // The text to use in the subtitle section
  let subtitleText;
  // "Store Data ..." subtitle text
  let storeDataTitle;
  // The image to use in the data storage section
  let datastoreImage;
  // The paragraph text to use in the data storage section
  let datastoreText;
  // Title text of footer section
  let advantageText;
  // Institution bullet points for footer section
  let institutionBullets = [];
  // Researcher bullet points for footer section
  let researcherBullets = [];
  switch (variant) {
    case 'NIH':
      backgroundStyle = styles.nihBackground;
      subtitleImage = subtitleImageNih;
      subtitleText = (
        <p>
          The <b>DUOS</b> can help your institution easily meet DMS requirements, and while maintaining ownership and gaining better visibility of
          your institutions&apos;s scientific data.
        </p>
      );
      storeDataTitle = 'Store Data Anywhere';
      datastoreImage = storeDataImageNih;
      datastoreText = (
        <>
          <p>
            Upload your data to the cloud, as you would with one of our partner products like <b>Terra</b> or the <b>AnVIL</b>, or keep it locally
            available while still making it available for sharing and access via DUOS.
          </p>
          <p>
            For independent storage locations, investigators will remain responsible for granting access to users throughout the life of the data.
          </p>
        </>
      );
      advantageText = 'Advantages of using DUOS';
      institutionBullets.push('Avoid your investigators placing institutional data in various, untrackable repositories');
      institutionBullets.push('View data compliance by investigators and grants across your institution');
      researcherBullets.push('Easily store, share, access and analyze data in a secure environment');
      researcherBullets.push('View data available from across your institution & prominent NIH research programs (ex. NHGRI AnVIL)');
      break;
    case 'ANVIL':
      backgroundStyle = styles.anvilBackground;
      subtitleImage = subtitleImageAnvil;
      subtitleText = (
        <p>
          NHGRI&apos;s <b>AnVIL ecosystem</b> can help your institution easily meet DMS requirements while maintaining ownership and gaining better visibility of
          your institution&apos;s scientific data.
        </p>
      );
      storeDataTitle = 'Store Data';
      datastoreImage = storeDataImageAnvil;
      datastoreText = (
        <p>
          The <b>AnVIL</b> offers easy-to-use interfaces for uploading data to secure cloud locations on Azure or Google Cloud, with special tools
          to help calibrate storage and data access. Storage cost and management can be configured at either the investigator or institutional level,
          depending on your preference.
        </p>
      );
      advantageText = 'Advantages of the AnVIL ecosystem';
      institutionBullets.push('Avoid your investigators placing institutional data in various, untrackable repositories');
      institutionBullets.push('Maintain ownership of the data storage location rather than transferring to third-party repositories');
      institutionBullets.push('View data compliance by investigators and grants across your institution');
      institutionBullets.push("Control long-term storage costs and accessof your institution's data");
      researcherBullets.push('Easily store, share, access and analyze data in a secure environment');
      researcherBullets.push('View data available from across your institution & prominent NIH research programs (ex. NHGRI AnVIL)');
      break;
  }

  return(
    <div className="base-style" style={{...styles.baseStyle, ...backgroundStyle}}>
      <div className="section title-text">
        <div className="section-text">
          <div className="centered" style={Styles.TITLE}>
            Meet NIH&apos;s 2023 Data Management & Sharing (DMS) Policy requirements for your institution
            {variant === 'NIH' ? '' : ' with AnViL'}
          </div>
          <div className="centered" style={Styles.SUB_HEADER}>
            An easy
            {variant === 'NIH' ? '' : ' data sharing'}
            &nbsp;solution for grant compliance and research teams
          </div>
        </div>
      </div>

      <div className="section subtitle-section">
        <img src={subtitleImage}/>
        <div className="section-text">
          <div className="centered">
            {subtitleText}
          </div>
        </div>
      </div>

      <div className="section store-data-section">
        <div className="section-text">
          <Grid container>
            <Grid item xs={12} sm={6} className="vertical-centered">
              <div style={Styles.TITLE}>
                {storeDataTitle}
              </div>
              <div>
                {datastoreText}
              </div>
            </Grid>
            <Grid item xs={12} sm={6} className="vertical-centered">
              {renderSectionImage(datastoreImage, 'data store section image')}
            </Grid>
          </Grid>
        </div>
      </div>

      <div className="section share-data-section">
        <div className="section-text">
          <Grid container>
            <Grid item xs={12} sm={6} className="vertical-centered">
              {renderSectionImage(shareDataImage, 'data sharing section image')}
            </Grid>
            <Grid item xs={12} sm={6} className="vertical-centered">
              <div style={Styles.TITLE}>
                Share Data
              </div>
              <div>
                <p>
                  <b>DUOS</b> enables investigators to catalog data for search and publish in a publicly accessible catalog, including adding
                  data use limitations and assigning to a <b>DAC - Data Access Committee</b> if needed. When finished, investigators&apos; datasets will a have
                  unique ID for their dataset, which can be findable in the catalog by secondary researchers, satisfying DMS requirements for public sharing.
                </p>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>

      <div className="section manage-access-section">
        <div className="section-text">
          <Grid container>
            <Grid item xs={12} sm={6} className="vertical-centered">
              <div style={Styles.TITLE}>
                Manage Access
              </div>
              <div>

                {
                  variant === 'NIH' ?
                    <p>
                      In <b>DUOS</b>, institutions are able to set up their own central DAC, allow investigators to create and administer DACs themselves, or
                      leverage DUOS&apos; internal DAC for a fee.
                    </p> :
                    <p><b>DUOS</b> can register open-access and controlled-access datasets, regardless of the storage locationn, or if the DAC received
                      requests via DUOS or another mechanism.</p>
                }


                <p>
                  DUOS offers a consistent, simple user interfaces for DACs to manage and respond to request, in addition to maintain auditable records,
                  providing institution level stats use of your research data and datasets shared publicly to ensure DMS Policy compliance.
                </p>

              </div>
            </Grid>
            <Grid item xs={12} sm={6} className="vertical-centered">
              {renderSectionImage(manageAccessImage, 'data management section image')}
            </Grid>
          </Grid>
        </div>
      </div>

      <div className="section advantages-section">
        <div className="section-text">
          <div className="centered" style={Styles.TITLE}>
            {advantageText}
          </div>
          <Grid container spacing={10}>
            <Grid item xs={12} sm={6}>
              <div>
                <p>
                  Institutions can:
                </p>
                {institutionBullets.map(renderInfoBox)}
              </div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <div>
                <p>
                  Researchers can:
                </p>
                {researcherBullets.map(renderInfoBox)}
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </div>
  );
}

export const NIHDMSPolicyInfo = (props) => (<DMSPolicyInfo {...props} variant="NIH"/>);
export const AnVILDMSPolicyInfo = (props) => (<DMSPolicyInfo {...props} variant="ANVIL"/>);

