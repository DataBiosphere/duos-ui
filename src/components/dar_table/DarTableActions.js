import { isEmpty, filter, isNil, find } from 'lodash/fp';
import { h, div, span, a } from 'react-hyperscript-helpers';
import { Storage } from '../../libs/storage';
import DarTableVoteButton from './DarTableVoteButton';
import DarTableOpenButton from './DarTableOpenButton';
import DarTableCancelButton from './DarTableCancelButton';

export default function DarTableActions(props) {
  const { updateLists, openConfirmation, history, electionInfo, consoleType, extraOptions, index, baseStyle } = props;
  const { election, dar, votes, researcher = {}, dac = {} } = electionInfo;
  const currentUser = Storage.getCurrentUser();
  const currentUserId = currentUser.dacUserId;
  const currentUserRoles = currentUser.roles;
  const chairVote = find((role) => role.name === 'Chairperson' && role.dacId === dac.dacId)(currentUser.roles);
  const isChair = !isEmpty(currentUserRoles) && !isEmpty(dac) && !isNil(chairVote);
  //template type is used to initialize general visibility options for buttons
  //extraOptions is an object that contains boolean values for more granular control. Will be applied after template
  //EXAMPLE: You want to use the chair setup but would like to see researcher buttons.
  //extraOptions.showResearcher = true will activate that feature
  //Both are intended to control button visibility for non-guaranteed features (ex: Vote)
  const templates = {
    chair: {
      showVote: true,
      showCancelIcon: true,
      showResearcher: false
    },
    manageAccess: {
      showVote: false,
      showCancelIcon: false,
      showResearcher: true
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

  const goToResearcherReview = (history, id) => {
    history.push(`researcher_review/${id}`);
  };
  //NOTE: template is pretty much lifted from the old ManageAccess page
  //only difference is it's being generated in function form
  const createResearcherButtons = (dar, showResearcher, history, researcher = {}) => {
    const referenceId = dar.referenceId;
    return div({
      key: `researcher-buttons-${referenceId}`,
      style: {margin: "0 15px 8px"},
      className: "bonafide-icon" ,
      isRendered: showResearcher
    }, [
      //data-tip allows ReactTooltip to render a tooltip on the specified element
      a({
        id: dar.referenceId + "_flagBonafide",
        key: dar.referenceId + "_flagBonafide",
        name: "flag_bonafide",
        onClick: () => goToResearcherReview(history,dar.userId)
      }, [
        span({
          className: "glyphicon glyphicon-thumbs-up dataset-color",
          key: `tip-bonafide-${referenceId}`,
          isRendered: !isEmpty(researcher) && researcher.status === 'approved',
          "data-tip": "Bonafide researcher"
        }),
        span({
          key: `tip-non-bonafide-${referenceId}`,
          className: "glyphicon glyphicon-thumbs-down cancel-color",
          isRendered: !isEmpty(researcher) && researcher.status === 'rejected',
          "data-tip": "Non-Bonafide researcher"
        }),
        span({
          key: `tip-pending-review-${referenceId}`,
          className: "glyphicon glyphicon-hand-right hover-color",
          isRendered: !isEmpty(researcher) && researcher.status === 'pending',
          "data-tip": "Researcher review pending"
        }),
        span({
          key: `dismiss-${referenceId}`,
          className: "glyphicon glyphicon-hand-right dismiss-color",
          isRendered: !isEmpty(researcher) && researcher.status === null
        }),
      ])
    ]);
  };

  const template = (election, dar, votes, history, index, visibilityOptions, baseStyle, currentUserId) => {
    const darReferenceId = dar.referenceId;
    const targetVotes = filter((v) => {
      const belongsToUser = (currentUserId === v.dacUserId);
      const targetTypes = (v.type === 'Chairperson' || v.type === 'DAC');
      return belongsToUser && targetTypes;
    })(votes);

    return ([
      div({style: baseStyle, key: `dar-${dar.referenceId}-action-buttons`, isRendered: !isNil(dar)}, [
        h(DarTableVoteButton, {
          election,
          history,
          darReferenceId,
          disabled: isEmpty(targetVotes),
          isRendered: visibilityOptions.showVote && isElectionOpen(election),
        }),
        h(DarTableCancelButton, {
          election,
          darReferenceId,
          index,
          updateLists,
          isIcon: visibilityOptions.showCancelIcon,
          isRendered: isElectionOpen(election),
          disabled: !isChair && consoleType !== 'manageAccess'
        }),
        h(DarTableOpenButton, {
          dar,
          index,
          openConfirmation,
          label: 'Open',
          isRendered: !isElectionOpen(election),
          disabled: !isChair && consoleType !== 'manageAccess'
        }),
        createResearcherButtons(dar, visibilityOptions.showResearcher, history, researcher)
      ])
    ]);
  };

  return template(election, dar, votes, history, index, visibilityOptions, baseStyle, currentUserId);
}