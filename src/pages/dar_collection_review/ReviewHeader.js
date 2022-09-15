import { Fragment } from 'react';
import { h, div, span } from 'react-hyperscript-helpers';

const styles = {
  header: {
    fontWeight: 600,
    marginRight: '1rem'
  },
  default: {
    fontSize: '1.1rem',
    fontWeight: 400
  },
  darCode: {
    borderRight: '2px solid black',
    marginRight: '1rem',
    paddingRight: '1rem',
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
  },
  secondaryHeaderRow: {
    fontSize: '3rem',
    fontWeight: 600,
  },
};

const appliedPrimaryHeaderStyle = Object.assign({}, styles.containerRow, styles.primaryHeaderRow);
const appliedSecondaryHeaderStyle =  Object.assign({}, styles.containerRow, styles.secondaryHeaderRow);

export default function ReviewHeader(props) {
  const {
    darCode,
    projectTitle,
    readOnly = false,
    isLoading
  } = props;
  return (
    h(Fragment, {}, [
      div({className: 'header-container', isRendered: !isLoading, style: { marginBottom: '3rem' }}, [
        div({className: 'primary-header-row', style: appliedPrimaryHeaderStyle}, [
          span({style: styles.header}, [`Data Access Request Review${readOnly ? ' (read-only)' : ''}`])
        ]),
        div({className: 'secondary-header-row', style: appliedSecondaryHeaderStyle}, [
          span({style: styles.darCode}, [darCode]),
          div({className: 'collection-project-title'}, [projectTitle])
        ]),
      ]),
      div({className: 'header-skeleton-loader', isRendered: isLoading}, [
        div({className: 'primary-header-skeleton', style: appliedPrimaryHeaderStyle}, [
          div({className: 'text-placeholder', style: { width: '35rem', height: '2.5rem', marginBottom: '0.5rem'}}),
        ]),
        div({className: 'secondary-header-skeleton', style: styles.containerRow}, [
          div({className: 'text-placeholder', style: {width: '15rem', height: '4rem', marginBottom: '0.5rem'}}),
          div({className: 'text-placeholder', style: {width: '40rem', height: '4rem', marginBottom: '0.5rem'}})
        ]),
        div({style: styles.containerRow}, [
          div({className: 'text-placeholder', style: {width: '16rem', height: '3rem', marginBottom: '3.5rem'}})
        ])
      ])
    ])
  );
}
