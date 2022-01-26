import { a, div, footer, img, li, ul } from 'react-hyperscript-helpers';
import footerLogo from '../images/broad_logo_allwhite.png';

function DuosFooter() {

  const footerStyle = {
    position: 'relative',
    clear: 'both',
    backgroundColor: '#000000',
    minHeight: '64px'
  };

  const mainFooterStyle = {
    display: 'block',
    width: '100%',
    padding: '0 20px'
  };

  const footerLogoStyle = {
    float: 'left',
    height: '32px',
    marginTop: '15px',
    marginRight: '35px'
  };

  return (
    div({ style: footerStyle }, [
      footer({ style: mainFooterStyle }, [
        img({ src: footerLogo, style: footerLogoStyle, alt: "Broad Institute logo" }),
        ul({ className: "footer-links" }, [
          li({ className: "footer-links__item" }, ["\u00A9 Broad Institute"]),
          li({ className: "footer-links__item" }, [a({ href: "/privacy" }, ["Privacy Policy"]),]),
          li({ className: "footer-links__item" }, [a({ target: '_blank', href: "https://www.broadinstitute.org/terms-conditions" }, ["Terms of Service"]),]),
          li({ className: 'footer-links__item' }, [a({ href: '/status' }, ['Status'])])
        ])
      ])
    ])
  );
}

export default DuosFooter;
