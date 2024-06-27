import React from 'react';
import { ReadMore } from '../components/ReadMore';
import homeHeaderBackground from '../images/home_header_background.png';
import duosLogoImg from '../images/duos_logo.svg';
import duosDiagram from '../images/DUOS_Homepage_diagram.svg';
import { Link } from 'react-router-dom';
import { Storage } from '../libs/storage';

const Home = (props) => {
  const homeTitle = {
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: '28px',
    fontWeight: 600,
    textAlign: 'center',
    padding: '0 5rem'
  };

  const homeBannerDescription = {
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: '20px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    padding: '0 10rem'
  };

  const duosLogo = {
    height: '80px',
    width: '300px',
    display: 'block',
    margin: '0 auto 3rem',
    padding: '0 3rem'
  };

  const header = {
    color: '#1F3B50',
    fontFamily: 'Montserrat',
    fontSize: '24px',
    fontWeight: 600,
    textAlign: 'center',
    padding: '0 5rem'
  };

  const subHeader = {
    color: '#1F3B50',
    fontFamily: 'Montserrat',
    fontSize: '16px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    padding: '0 5rem'
  };

  const description = {
    color: '#1F3B50',
    fontFamily: 'Montserrat',
    fontSize: '14px',
    textAlign: 'center',
    textIndent: '10px',
    whiteSpace: 'pre-wrap',
    padding: '10px 1rem',
  };

  const paragraph = {
    color: '#1F3B50',
    padding: '0 5rem 2rem 5rem',
    fontFamily: 'Montserrat',
    fontSize: '14px',
    textAlign: 'justify',
    textIndent: '10px'
  };

  const readMoreStyle = {
    fontFamily: 'Montserrat',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center',
    display: 'block'
  };

  const signInPositionStyle = {
    padding: '1em 1em 0 0',
    alignItems: 'center',
    position: 'absolute',
    top: '0',
    right: '1rem',
  };

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div className="row" style={{ backgroundColor: 'white', height: '350px', position: 'relative', margin: '-20px auto auto 0' }}>
          <img style={{ height: 'inherit', minWidth: '100%' }} src={homeHeaderBackground} alt="Home header background" />
          <div style={{ position: 'absolute', width: '100%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <img style={duosLogo} alt="DUOS logo" src={duosLogoImg} />
            <h1 style={homeTitle}>Data Use Oversight System</h1>
            <div className="hidden-xs" style={homeBannerDescription}>
              Expediting compliant data sharing, by facilitating data submissions and access requests <br/> for researchers and data access committees
            </div>
          </div>
        </div>
        <div className="row">
          <div style={{ margin: '5rem auto 0', backgroundColor: 'white' }}>
            <h1 style={header}>What is DUOS and how does it work?</h1>
            <h3 style={subHeader}>
              DUOS is a multi-sided data sharing platform bringing together researchers submitting and requesting data, <br /> and data access committees and institutional officials overseeing the use of the data.
            </h3>
            <div>
              <img className="col-sm-10 hidden-xs" style={{ padding: '1rem', margin: 'auto 8.25%' }} alt="What is DUOS graphic" src={duosDiagram} />
            </div>
          </div>
        </div>
        <div className="row" style={{ background: '#eff0f2', margin: '50px 0', padding: '48px 0 60px 0' }}>
          <div className="col-lg-4 col-md-4">
            <p style={header}>DUOS for DACs</p>
            <p style={description}>DACs can swiftly manage data access requests <br /> and clearly track data use compliance.</p>
            <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
              <a id="zendesk-dac-link" href="https://broad-duos.zendesk.com/hc/en-us/articles/360060401131-Data-Access-Committee-User-Guide" target="_blank" rel="noreferrer" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
            </div>
          </div>
          <div className="col-lg-4 col-md-4 ">
            <p style={header}>Institutional Oversight</p>
            <p style={description}>DUOS reduces repetitive work for Signing Officials and expedites data sharing through our innovative Library Card-style agreements.</p>
            <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
              <a href="https://broad-duos.zendesk.com/hc/en-us/articles/360060402751-Signing-Official-User-Guide" target="_blank" rel="noreferrer" id="zendesk-so-link" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <p style={header}>Looking for data?</p>
            <p style={description}>DUOS helps researchers request and access data from multiple sources with a single application.</p>
            <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
              <a href="https://broad-duos.zendesk.com/hc/en-us/articles/360060402551-Researcher-User-Guide" id="zendesk-researcher-link" target="_blank" rel="noreferrer" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
            </div>
          </div>
        </div>
        <div className="row" style={{ margin: 'auto auto 5rem auto' }}>
          <div className="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2">
            <div>
              <h1 style={header}>Overview of DUOS</h1>
              <ReadMore
                props={props}
                readStyle={readMoreStyle}
                content={[
                  <p style={paragraph} key="p-0">
                    Increasingly, a major challenge to data sharing is navigating the complex web of restrictions on secondary data use. Human subjects datasets often have complex and/or ambiguous restrictions on future use deduced from the original consent form, which must be respected when utilizing data. Previously, such data use restrictions were uniquely drafted across institutions, creating vast inconsistencies and requiring the investment of significant human effort to determine if researchers should be permitted to use the data. With support from DUOS team members, the Global Alliance for Genomics and Health (GA4GH) published a solution for this ambiguous and inconsistent data sharing language in the form of their
                    {' '}
                    <a href="https://www.ga4gh.org/genomic-data-toolkit/regulatory-ethics-toolkit/#:~:text=Machine%20Readable%20Consent%20Guidance&text=Machine%20readable%20consent%20language%20is,to%20for%20their%20research%20purposes" target="_blank" rel="noreferrer">Machine Readable Consent Guidance.</a>
                    {' '}
                    For help determining your data&apos;s permitted uses, try our
                    {' '}
                    <Link to="/consent_text_generator">Data Sharing Language Tool</Link>, which follows GA4GH guidelines.
                  </p>
                ]}
                moreContent={[
                  <div key="p-1">
                    <p style={paragraph}>As part of our efforts to enhance collaborative research, the Broad Institute developed the “Data Use Oversight System” (DUOS) to semi-automate and efficiently manage compliant sharing of human subjects data. DUOS&apos; objective is two-fold, to enhance data access committee&apos;s confidence that data use restrictions are respected while efficiently enabling appropriate data access.</p>
                    <p style={paragraph}>To better enable the use of existing human subjects datasets in future projects, DUOS mimics, in a semi-automated fashion, the data access request review processes common to DACs globally, like those in dbGaP. To this end, the system includes interfaces to capture and structure data use restrictions and data access requests as machine-readable data use terms based on the GA4GH&apos;s Data Use Ontology. With these machine-readable terms for dataset&apos;s use limitations and data access requests established, DUOS is able to trigger a matching algorithm to reason if data access should be granted given the research purpose and the data restrictions, serving as a decision support tool for DACs using DUOS.</p>
                    <p style={paragraph}>To evaluate the feasibility of using machine readable data use terms to interpret data use restrictions and access requests, we are piloting a trial of DUOS overseen by Partners’ Healthcare IRB. During the pilot, DACs comprised of governmental and non-governmental data custodians will pilot the use of DUOS, its ability to structure use limitations and access requests, and the accuracy of the DUOS algorithm. This aids us in improving the DUOS algorithm and providing feedback on the GA4GH Data Use Ontology based on experts’ feedback.</p>
                  </div>
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
