import { h, div } from "react-hyperscript-helpers";
import { useEffect, useState } from 'react';
import { find, lowerCase, isEmpty, isNil } from "lodash/fp";
import SimpleButton from "../SimpleButton";
import { Theme } from "../../libs/theme";

const baseColor = Theme.palette.secondary;

export default function MemberActions(props) {

  const isButtonEnabled = ({elections, user}) => {
    let userVote;
    const enabledElection = find((election) => {
      const {votes} = election;
      const userVote = find((vote) => {
        vote.dacuserid = user.dacuserid;
      })(votes);
      const isElectionOpen = (election => {
        const lowerCaseStatus = lowerCase(election.status);
        return lowerCaseStatus !== 'canceled' || lowerCaseStatus !== 'closed';
      });
      return userVote && isElectionOpen;
    })(elections);

    return {enabledElection, userVote};
  };

  /*
  For a collection, the component needs:
    Current User
    Elections in the collection,
    Votes attached to the collection
  */
  //NOTE: update init method to work like the other two actions
  //buttons should just take the collection and have the filtering/processing occur here
  const {elections, user, style, collectionId, history} = props;
  const [disabled, setDisabled] = useState([]);
  const [label, setLabel] = useState('Vote');

  useEffect(() => {
    const { userVote, enabledElection } = isButtonEnabled({elections, user});
    setDisabled(isEmpty(enabledElection));
    setLabel(!isNil(userVote) ? 'Update Vote' : 'Vote');
  }, [user, elections]);

  return div({ style }, [
    h(SimpleButton, {
      label,
      disabled,
      keyProp: `${collectionId}-vote-button`,
      baseColor,
      additionalStyle: {
        padding: '5px 10px',
        fontSize: '1.45rem',
      },
      onClick: () => history.push(`/dar_collections/${collectionId}`)
    })
  ]);

  //This is an example of how the table column for actions would be configured for member actions
  // return {
  //   data: h(MemberActions, {elections, user, style, collectionId, history}),
  //   isComponent: true,
  //   id: `collection-${collectionId}-member-actions`,
  //   label: 'vote-button'
  // };
}
