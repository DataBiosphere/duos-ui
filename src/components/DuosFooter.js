import { a, div, footer, img, li, ul } from 'react-hyperscript-helpers';
import { Storage } from '../libs/storage';
import _ from 'lodash';

const DuosFooter = (props) => {
  const user = Storage.getCurrentUser();

  const isAdmin = props.isLogged ? Storage.getCurrentUser().isAdmin : false;
  const supportLink = isAdmin ? '/help_reports' : '/home_help';

  return (
    div({ className: "footer" }, [
      footer({ className: "main-footer" }, [
        img({ src: "/images/broad_logo_allwhite.png", className: "footer-logo", alt: "Broad Institute logo" }),
        ul({ className: "footer-links" }, [
          li({ className: "footer-links__item" }, ["\u00A9 Broad Institute"]),
          li({ className: "footer-links__item" }, [a({ target: '_blank', href: "https://www.broadinstitute.org/privacy-policy" }, ["Privacy Policy"]),]),
          li({ className: "footer-links__item" }, [a({ target: '_blank', href: "https://www.broadinstitute.org/terms-conditions" }, ["Terms of Service"]),]),
          li({ className: "footer-links__item" }, [a({ href: supportLink }, ["Support"]),]),
          li({ className: 'footer-links__item' }, [a({ href: '/status' }, ['Status'])])
        ])
      ])
    ])
  );
}

export default DuosFooter;
