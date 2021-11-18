import { div, span } from 'react-hyperscript-helpers';

const styles = {
  header: {
    fontWeight: 600,
    marginRight: '1rem'
  },
  secondaryHeader: {
    fontSize: '1.8rem',
    fontWeight: 400,
    marginRight: '1rem',
    paddingRight: '1rem',
    borderRight: '1px solid black'
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: 600,
    marginBottom: '1.5rem'
  },
  default: {
    fontSize: '1.1rem',
    fontWeight: 400
  },
  darCode: {
    borderRight: "2px solid black",
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

export default function ReviewHeader(props) {
  const {
    darCode,
    projectTitle,
    downloadLink,
    redirectLink
  } = props;
  return (
    div({className: 'header-container'},[
      div({className: 'primary-header-row', style: Object.assign({}, styles.containerRow, styles.primaryHeaderRow)}, [
        span({style: styles.header}, ["Data Access Request Review"]),
        redirectLink
      ]),
      div({className: 'secondary-header-row', style: styles.containerRow}, [
        span({style: styles.secondaryHeader}, [darCode]),
        downloadLink
      ]),
      div({style: styles.containerRow}, [
        div({className: 'collection-project-title', style: styles.title}, [projectTitle])
      ])
    ])
  );
}
