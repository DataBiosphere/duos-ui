import { Fragment } from 'react';
import { h, div, span } from 'react-hyperscript-helpers';

const styles = {
  header: {
    fontWeight: 600,
    marginRight: '1rem'
  },
  secondaryHeader: {
    fontSize: '2.2rem',
    fontWeight: 400,
    marginRight: '1rem',
    paddingRight: '1rem',
    borderRight: '1px solid black'
  },
  title: {
    fontSize: '3rem',
    fontWeight: 600,
    marginBottom: '1.5rem'
  },
  default: {
    fontSize: '1.1rem',
    fontWeight: 400
  },
  darCode: {
    borderRight: '2px solid black',
    paddingRight: '0.5rem'
  },
  containerRow: {
    margin: '0rem 1.2rem',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    marginLeft: '0px'
  },
  primaryHeaderRow: {
    fontSize: '2.1rem',
    marginBottom: '3.2rem'
  }
};

const appliedPrimaryHeaderStyle = Object.assign({}, styles.containerRow, styles.primaryHeaderRow);

export default function ReviewHeader(props) {
  const {
    darCode,
    projectTitle,
    downloadLink,
    redirectLink,
    isLoading
  } = props;
  return (
    h(Fragment, {}, [
      div({className: 'header-container', isRendered: !isLoading}, [
        div({className: 'primary-header-row', style: appliedPrimaryHeaderStyle}, [
          span({style: styles.header}, ['Data Access Request Review']),
          redirectLink
        ]),
        div({className: 'secondary-header-row', style: styles.containerRow}, [
          span({style: styles.secondaryHeader}, [darCode]),
          downloadLink
        ]),
        div({style: styles.containerRow}, [
          div({className: 'collection-project-title', style: styles.title}, [projectTitle])
        ])
      ]),
      div({className: 'header-skeleton-loader', isRendered: isLoading}, [
        div({className: 'primary-header-skeleton', style: appliedPrimaryHeaderStyle}, [
          div({className: 'text-placeholder', style: { width: '30%', height: '2.2rem'}}),
        ]),
        div({className: 'secondary-header-skeleton', style: styles.containerRow}, [
          div({className: 'text-placeholder', style: {width: '15%', height: '2.5rem'}})
        ]),
        div({style: styles.containerRow}, [
          div({className: 'text-placeholder', style: {width: '40%', height: '5rem', marginBottom: styles.title.marginBottom}})
        ])
      ])
    ])
  );
}
