import { Grid } from '@material-ui/core';
import clsx from 'clsx';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
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

import style from './DMSPolicyInfo.module.css';

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
    <div className={style['info-box']} key={`${index}`}>
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
          NHGRI&apos;s <b>AnVIL ecosystem</b> can be branded and customized to help your institution easily meet DMS requirements while maintaining
          ownership and gaining better visibility of your institution&apos;s scientific data.
        </p>
      );
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
    <div className={style['base-style']} style={{...styles.baseStyle, ...backgroundStyle}}>
      <div className={clsx(style.section, style['title-text'])}>
        <div className={style['section-text']}>
          <div className={style.centered} style={Styles.TITLE}>
            Meet NIH&apos;s 2023 Data Management & Sharing (DMS) Policy requirements for your institution
          </div>
          <div className={style.centered} style={Styles.SUB_HEADER}>
            An easy solution for grant compliance and research teams
          </div>
        </div>
      </div>

      <div className={clsx(style.section, style['subtitle-section'])}>
        <img src={subtitleImage}/>
        <div className={style['section-text']}>
          <div className={style.centered}>
            {subtitleText}
          </div>
        </div>
      </div>

      <div className={clsx(style.section, style['store-data-section'])}>
        <div className={style['section-text']}>
          <Grid container>
            <Grid item xs={12} sm={6} className={style['vertical-centered']}>
              <div style={Styles.TITLE}>
                Store Data Anywhere
              </div>
              <div>
                {datastoreText}
              </div>
            </Grid>
            <Grid item xs={12} sm={6} className={style['vertical-centered']}>
              {renderSectionImage(datastoreImage, 'data store section image')}
            </Grid>
          </Grid>
        </div>
      </div>

      <div className={clsx(style.section, style['share-data-section'])}>
        <div className={style['section-text']}>
          <Grid container>
            <Grid item xs={12} sm={6} className={style['vertical-centered']}>
              {renderSectionImage(shareDataImage, 'data sharing section image')}
            </Grid>
            <Grid item xs={12} sm={6} className={style['vertical-centered']}>
              <div style={Styles.TITLE}>
                Share Data
              </div>
              <div>
                <p>
                  <b>DUOS</b> enables investigators to catalog data for search and publish in a publicly accessible catalog, including adding
                  data use limitations and assigning to a <b>DAC - Data Access Committee</b>. When finished, investigators&apos; datasets will a have
                  unique ID for their dataset which can be findable in the catalog by secondary researchers, satisfying DMS requirements for public sharing.
                </p>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>

      <div className={clsx(style.section, style['manage-access-section'])}>
        <div className={style['section-text']}>
          <Grid container>
            <Grid item xs={12} sm={6} className={style['vertical-centered']}>
              <div style={Styles.TITLE}>
                Manage Access
              </div>
              <div>
                <p>
                  In <b>DUOS</b>, institutions are able to set up their own central DAC, allow investigators to create and administer DACs themselves, or
                  leverage DUOS&apos; internal DAC for a fee.
                </p>

                <p>
                  DUOS offers a consistent, simple user interfaces for DACs to manage and respond to request, in addition to maintain auditable records,
                  providing institution level stats use of your research data and datasets shared publicly to ensure DMS Policy compliance.
                </p>
              </div>
            </Grid>
            <Grid item xs={12} sm={6} className={style['vertical-centered']}>
              {renderSectionImage(manageAccessImage, 'data management section image')}
            </Grid>
          </Grid>
        </div>
      </div>

      <div className={clsx(style.section, style['advantages-section'])}>
        <div className={style['section-text']}>
          <div className={style.centered} style={Styles.TITLE}>
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