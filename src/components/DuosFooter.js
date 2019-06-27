import { Component } from 'react';
import { div, footer, ul, li, img, a } from 'react-hyperscript-helpers';

class DuosFooter extends Component {

  render() {
    const supportLink = this.props.isLogged ? '/help_reports' : '/home_help';
    return (
      div({ className: "footer" }, [
        footer({ className: "main-footer" }, [
          ul({ className: "footer-links" }, [
            li({ className: "footer-links__item" }, ["\u00A9 Broad Institute"]),
            li({ className: "footer-links__item" }, [a({ target: '_blank', href: "https://www.broadinstitute.org/privacy-policy" }, ["Privacy Policy"]),]),
            li({ className: "footer-links__item" }, [a({ target: '_blank', href: "https://www.broadinstitute.org/terms-conditions" }, ["Terms of Service"]),]),
            li({ className: "footer-links__item" }, [a({ href: supportLink }, ["Support"]),]),
          ]),
          img({ src: "/images/broad_logo.svg", className: "footer-logo", alt: "Broad Institute logo" })
        ])
      ])
    );
  }
}

export default DuosFooter;
