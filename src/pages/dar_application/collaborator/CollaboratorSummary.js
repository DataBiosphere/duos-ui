import { div, p } from 'react-hyperscript-helpers';

export const CollaboratorSummary = (props) => {
  const {
    collaborator,
    id
  } = props;

  return div({}, [
    div({
      id: id,
      style: {
        display: 'flex',
        justifyContent: 'space-around',
        margin: '1.5rem 0 1.5rem 0',
      }
    }, [

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Name']),
        collaborator.name,
      ]),

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Title']),
        collaborator.title,
      ]),

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['eRA ID']),
        collaborator.eraCommonsId,
      ]),

      div({
        style: {
          flex: '1 1 100%',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Email']),
        p({}, [
          collaborator.email,
        ]),
      ]),
    ]),
  ]);
};

export default CollaboratorSummary;