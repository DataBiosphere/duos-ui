import { Grid } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import React from 'react'
import homeHeaderBackground from 'src/images/home_header_background.png'
import anvilBackground from 'src/images/anvil_background.jpg'
import subtitleImageNih from 'src/images/duos_laptops.png'
import subtitleImageAnvil from 'src/images/anvil_laptops.png'
import storeDataImageNih from 'src/images/duos_chart.png'
import storeDataImageAnvil from 'src/images/anvil_data_store.png'
import shareDataImage from 'src/images/share_data.png'
import manageAccessImage from 'src/images/duos_manages_access.png'
import { Theme, Styles } from 'src/libs/theme'

import 'src/pages/DMSPolicyInfo.css'

type DMSVariant = 'NIH' | 'ANVIL'

interface DMSPolicyInfoProps {
  variant: DMSVariant
}

interface VariantConfig {
  backgroundStyle: React.CSSProperties
  subtitleImage: string
  subtitleText: React.ReactElement
  storeDataTitle: string
  datastoreImage: string
  datastoreText: React.ReactElement
  advantageText: string
  institutionBullets: string[]
  researcherBullets: string[]
}

const baseStyle: React.CSSProperties = { color: Theme.palette.primary }

const nihBackground: React.CSSProperties = { backgroundImage: `url(${homeHeaderBackground})` }
const anvilBackground_: React.CSSProperties = {
  backgroundImage: `url(${anvilBackground})`,
  backgroundPosition: '-2px -4px',
}

const nihConfig: VariantConfig = {
  backgroundStyle: nihBackground,
  subtitleImage: subtitleImageNih,
  subtitleText: (
    <p>
      The
      {' '}
      <b>DUOS</b>
      {' '}
      can help your institution easily meet DMS requirements, and while maintaining ownership and gaining better visibility of
      your institutions&apos;s scientific data.
    </p>
  ),
  storeDataTitle: 'Store Data Anywhere',
  datastoreImage: storeDataImageNih,
  datastoreText: (
    <>
      <p>
        Upload your data to the cloud, as you would with one of our partner products like
        {' '}
        <b>Terra</b>
        {' '}
        or the
        {' '}
        <b>AnVIL</b>, or keep it locally available while still making it available for sharing and access via DUOS.
      </p>
      <p>
        For independent storage locations, investigators will remain responsible for granting access to users throughout the life of the data.
      </p>
    </>
  ),
  advantageText: 'Advantages of using DUOS',
  institutionBullets: [
    'Avoid your investigators placing institutional data in various, untrackable repositories',
    'View data compliance by investigators and grants across your institution',
  ],
  researcherBullets: [
    'Easily store, share, access and analyze data in a secure environment',
    'View data available from across your institution & prominent NIH research programs (ex. NHGRI AnVIL)',
  ],
}

const anvilConfig: VariantConfig = {
  backgroundStyle: anvilBackground_,
  subtitleImage: subtitleImageAnvil,
  subtitleText: (
    <p>
      NHGRI&apos;s
      {' '}
      <b>AnVIL ecosystem</b>
      {' '}
      can help your institution easily meet DMS requirements while maintaining ownership and gaining better visibility of
      your institution&apos;s scientific data.
    </p>
  ),
  storeDataTitle: 'Store Data',
  datastoreImage: storeDataImageAnvil,
  datastoreText: (
    <p>
      The
      {' '}
      <b>AnVIL</b>
      {' '}
      offers easy-to-use interfaces for uploading data to secure cloud locations on Azure or Google Cloud, with special tools
      to help calibrate storage and data access. Storage cost and management can be configured at either the investigator or institutional level,
      depending on your preference.
    </p>
  ),
  advantageText: 'Advantages of the AnVIL ecosystem',
  institutionBullets: [
    'Avoid your investigators placing institutional data in various, untrackable repositories',
    'Maintain ownership of the data storage location rather than transferring to third-party repositories',
    'View data compliance by investigators and grants across your institution',
    'Control long-term storage costs and accessof your institution\'s data',
  ],
  researcherBullets: [
    'Easily store, share, access and analyze data in a secure environment',
    'View data available from across your institution & prominent NIH research programs (ex. NHGRI AnVIL)',
  ],
}

const variantConfigs: Record<DMSVariant, VariantConfig> = {
  NIH: nihConfig,
  ANVIL: anvilConfig,
}

const renderSectionImage = (url: string, alt: string) => (
  <img src={url} alt={alt} />
)

const renderInfoBox = (text: string) => (
  <div className="info-box" key={text}>
    <CheckCircleIcon htmlColor="#74ae43" fontSize="large" />
    <div>
      {text}
    </div>
  </div>
)

function DMSPolicyInfo({ variant }: Readonly<DMSPolicyInfoProps>) {
  const {
    backgroundStyle,
    subtitleImage,
    subtitleText,
    storeDataTitle,
    datastoreImage,
    datastoreText,
    advantageText,
    institutionBullets,
    researcherBullets,
  } = variantConfigs[variant]

  return (
    <div className="base-style" style={{ ...baseStyle, ...backgroundStyle }}>
      <div className="section title-text">
        <div className="section-text">
          <div className="centered" style={Styles.TITLE}>
            Meet NIH&apos;s 2023 Data Management &amp; Sharing (DMS) Policy requirements for your institution
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
        <img src={subtitleImage} alt="subtitle section" />
        <div className="section-text">
          <div className="centered">
            {subtitleText}
          </div>
        </div>
      </div>

      <div className="section store-data-section">
        <div className="section-text">
          <Grid container>
            <Grid size={{ xs: 12, sm: 6 }} className="vertical-centered">
              <div style={Styles.TITLE}>
                {storeDataTitle}
              </div>
              <div>
                {datastoreText}
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} className="vertical-centered">
              {renderSectionImage(datastoreImage, 'data store section image')}
            </Grid>
          </Grid>
        </div>
      </div>

      <div className="section share-data-section">
        <div className="section-text">
          <Grid container>
            <Grid size={{ xs: 12, sm: 6 }} className="vertical-centered">
              {renderSectionImage(shareDataImage, 'data sharing section image')}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} className="vertical-centered">
              <div style={Styles.TITLE}>
                Share Data
              </div>
              <div>
                <p>
                  <b>DUOS</b>
                  {' '}
                  enables investigators to catalog data for search and publish in a publicly accessible catalog, including adding
                  data use limitations and assigning to a
                  <b>DAC - Data Access Committee</b>
                  {' '}
                  if needed. When finished, investigators&apos; datasets will a have
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
            <Grid size={{ xs: 12, sm: 6 }} className="vertical-centered">
              <div style={Styles.TITLE}>
                Manage Access
              </div>
              <div>
                {
                  variant === 'NIH'
                    ? (
                        <p>
                          In
                          {' '}
                          <b>DUOS</b>{', institutions are able to set up their own central DAC, allow investigators to create and administer DACs themselves, or leverage DUOS\' internal DAC for a fee.'}
                        </p>
                      )
                    : (
                        <p>
                          <b>DUOS</b>
                          {' '}
                          can register open-access and controlled-access datasets, regardless of the storage location, or if the DAC received
                          requests via DUOS or another mechanism.
                        </p>
                      )
                }
                <p>
                  DUOS offers a consistent, simple user interfaces for DACs to manage and respond to request, in addition to maintain auditable records,
                  providing institution level stats use of your research data and datasets shared publicly to ensure DMS Policy compliance.
                </p>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} className="vertical-centered">
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <div>
                <p>
                  Institutions can:
                </p>
                {institutionBullets.map(text => renderInfoBox(text))}
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <div>
                <p>
                  Researchers can:
                </p>
                {researcherBullets.map(text => renderInfoBox(text))}
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </div>
  )
}

export const NIHDMSPolicyInfo = () => <DMSPolicyInfo variant="NIH" />
export const AnVILDMSPolicyInfo = () => <DMSPolicyInfo variant="ANVIL" />
