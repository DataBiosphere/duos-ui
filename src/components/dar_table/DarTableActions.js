import { isEmpty, filter, isNil, find } from 'lodash/fp';
import { h, div } from 'react-hyperscript-helpers';
import { Storage } from '../../libs/storage';
import DarTableVoteButton from './DarTableVoteButton';
import DarTableOpenButton from './DarTableOpenButton';
import DarTableCancelButton from './DarTableCancelButton';

export const consoleTypes = {
  MEMBER: 'member',
  MANAGE_ACCESS: 'manageAccess',
  CHAIR: 'chair',
  SIGNING_OFFICIAL: 'signingOfficial'
};

export default function DarTableActions(props) {
  const { updateLists, openConfirmation, history, electionInfo, consoleType, extraOptions, index, baseStyle } = props;
  const { election, dar, votes, dac = {} } = electionInfo;
  const currentUser = Storage.getCurrentUser();
  const currentUserId = currentUser.dacUserId;
  const currentUserRoles = currentUser.roles;
  const chairVote = find((role) => role.name === 'Chairperson' && role.dacId === dac.dacId)(currentUser.roles);
  const isChair = !isEmpty(currentUserRoles) && !isEmpty(dac) && !isNil(chairVote);
  //template type is used to initialize general visibility options for buttons
  //extraOptions is an object that contains boolean values for more granular control. Will be applied after template
  //EXAMPLE: You want to use the member setup but would like to see vote buttons.
  //extraOptions.showVote = true will activate that feature
  //Both are intended to control button visibility for non-guaranteed features (ex: Vote)
  const templates = {
    chair: {
      showVote: true,
      showCancelIcon: true,
    },
    member: {
      showVote: true,
      showCancelIcon: false,
    },
    manageAccess: {
      showVote: false,
      showCancelIcon: false,
    },
    signingOfficial: {
      showVote: false,
      showCancelIcon: false,
    }
  };

  //applied extraOptions to template for final visibilityOptions reference
  let visibilityOptions = templates[consoleType];
  if(!isEmpty(extraOptions)) {
    Object.assign(visibilityOptions, extraOptions);
  }

  const isElectionOpen = (election) => {
    return !isNil(election) && election.status === 'Open';
  };


  const template = (election, dar, votes, history, index, visibilityOptions, baseStyle, currentUserId) => {
    const darReferenceId = dar.referenceId;
    const targetVotes = filter((v) => {
      const belongsToUser = (currentUserId === v.dacUserId);
      const targetTypes = (v.type === 'Chairperson' || v.type === 'DAC');
      return belongsToUser && targetTypes;
    })(votes);
    const addStyle = {
      height: '4rem'
    };
    return ([
      div({style: baseStyle, key: `dar-${dar.referenceId}-action-buttons`, isRendered: !isNil(dar) &&  consoleType !== consoleTypes.SIGNING_OFFICIAL }, [
        h(DarTableVoteButton, {
          targetVotes,
          election,
          history,
          darReferenceId,
          disabled: isEmpty(targetVotes),
          isRendered: visibilityOptions.showVote && isElectionOpen(election),
          addBaseStyle: addStyle
        }),
        h(DarTableCancelButton, {
          election,
          darReferenceId,
          index,
          updateLists,
          isIcon: visibilityOptions.showCancelIcon,
          isRendered: isElectionOpen(election) && consoleType !== consoleTypes.MEMBER,
          disabled: !isChair && consoleType !== consoleTypes.MANAGE_ACCESS,
          addBaseStyle: addStyle
        }),
        h(DarTableOpenButton, {
          dar,
          index,
          openConfirmation,
          label: 'Open',
          isRendered: !isElectionOpen(election),
          disabled: !isChair && consoleType !== consoleTypes.MANAGE_ACCESS,
          addBaseStyle: addStyle
        }),
      ])
    ]);
  };

  return template(election, dar, votes, history, index, visibilityOptions, baseStyle, currentUserId);
}
