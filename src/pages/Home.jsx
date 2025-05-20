import React from 'react';
import homeHeaderBackground from '../images/home_header_background.png';
import duosLogoImg from '../images/duos_logo.svg';
import duosDiagram from '../images/DUOS_Homepage_diagram.svg';
import broadLogo from '../images/broad_logo_allwhite.png';
import anvilLogo from '../images/anvil-logo.svg';
import hcaLogo from '../images/human-cell-atlas-logo.png';
import { OverflowTooltip } from '../components/Tooltips';
import { Link } from 'react-router-dom';

const Home = (props) => {
  const { isLogged } = props;

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

  const logoGrid = {
    display: 'flex',
    gap: '3rem',              
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
  };

  const baseCard = {
    width: 'clamp(240px, 26vw, 320px)',
    aspectRatio: '2 / 1',
    borderRadius: '6px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',     
  };

  const disabledCard = {
    ...baseCard,
    opacity: 0.8,
    cursor: 'not-allowed',
  };


  const logoImg = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  };

  return (
    <>
    <style>{`
        @media (max-width: 904px) {
          .logo-grid { flex-direction: column; }
        }
      `}</style>
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
              <a id="terra-support-dac-link" href="https://support.terra.bio/hc/en-us/articles/28513346337179-Overview-DUOS-for-Data-Access-Committees-DACs" target="_blank" rel="noreferrer" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
            </div>
          </div>
          <div className="col-lg-4 col-md-4 ">
            <p style={header}>Institutional Oversight</p>
            <p style={description}>DUOS reduces repetitive work for Signing Officials and expedites data sharing through our innovative Library Card-style agreements.</p>
            <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
              <a href="https://support.terra.bio/hc/en-us/articles/28512587249051-How-to-Pre-Authorize-Researchers-to-Submit-Data-Access-Requests-in-DUOS" target="_blank" rel="noreferrer" id="terra-support-so-link" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
            </div>
          </div>
          <div className="col-lg-4 col-md-4">
            <p style={header}>Looking for data?</p>
            <p style={description}>DUOS helps researchers request and access data from multiple sources with a single application.</p>
            <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
              <a href="https://support.terra.bio/hc/en-us/articles/28510385779099-Overview-DUOS-for-Researchers" id="terra-support-researcher-link" target="_blank" rel="noreferrer" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
            </div>
          </div>
        </div>

        <section style={{ margin: '5rem auto', padding: '0 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <p style={header}>Data Libraries in DUOS</p>
            <p style={description}>
              {isLogged 
                ? "Click the images below to view curated Data Libraries, and search and request access to data."
                : "Login to view curated Data Libraries, and search and request access to data."}
            </p>

            <div style={logoGrid} className="logo-grid">
            <OverflowTooltip id="anvil" tooltipText={isLogged ? "AnVIL" : "Please login to access AnVIL Data Library"}>
                <div className="logo-card" style={isLogged ? baseCard : disabledCard}>
                  {isLogged ? (
                    <Link to="/datalibrary/anvil" style={{ textDecoration: 'none', display: 'contents' }}>
                      <img src={anvilLogo} alt="AnVIL" style={logoImg} />
                    </Link>
                  ) : (
                    <img src={anvilLogo} alt="AnVIL" style={logoImg} />
                  )}
                </div>
              </OverflowTooltip>

              <OverflowTooltip id="broad" tooltipText={isLogged ? 'Broad Institute' : 'Please login to access Broad Institute Data Library'}>
                <div className="logo-card" style={{ ...(isLogged ? baseCard : disabledCard), background: '#1F3B50', padding: '15px' }}>
                  {isLogged ? (
                    <Link to="/datalibrary/broad" style={{ textDecoration: 'none', display: 'contents' }}>
                      <img src={broadLogo} alt="Broad Institute" style={logoImg} />
                    </Link>
                  ) : (
                    <img src={broadLogo} alt="Broad Institute" style={logoImg} />
                  )}
                </div>
              </OverflowTooltip>
       
              <OverflowTooltip id="hca" tooltipText={isLogged ? "Human Cell Atlas" : "Please login to access Human Cell Atlas Data Library"}>
                <div className="logo-card" style={isLogged ? baseCard : disabledCard}>
                  {isLogged ? (
                    <Link to="/datalibrary/HCA" style={{ textDecoration: 'none', display: 'contents' }}>
                      <img src={hcaLogo} alt="Human Cell Atlas" style={logoImg} />
                    </Link>
                  ) : (
                    <img src={hcaLogo} alt="Human Cell Atlas" style={logoImg} />
                  )}
                </div>
              </OverflowTooltip>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
};

export default Home;
