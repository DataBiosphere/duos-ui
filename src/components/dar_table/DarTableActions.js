import { isEmpty, filter, isNil, find } from 'lodash/fp';
import { User } from '../../libs/ajax';
import { h, div, span, a } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import { useEffect, useState } from 'react';
import { Storage } from '../../libs/storage';
import DarTableVoteButton from './DarTableVoteButton';
import DarTableOpenButton from './DarTableOpenButton';
import DarTableCancelButton from './DarTableCancelButton';

export default function DarTableActions(props) {
  const { updateLists, openConfirmation, history, electionInfo, consoleType, extraOptions, index, baseStyle } = props;
  const { election, dar, votes } = electionInfo;
  const [researcher, setResearcher] = useState({});
  const chairVote = find((vote) => vote.type === 'Chairperson')(votes);
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

  //function only fires on mount, not on re-render
  useEffect(() => {
    if(!isNil(dar) && !isNil(dar.data)) {
      const userId = dar.userId;
      const init = async(userId) => {
        const user = await User.getById(userId);
        setResearcher(user);
      };
      init(userId);
    }
  }, [dar]);

  useEffect(() => {
    ReactTooltip.rebuild();
  }, [researcher]);

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
  const createResearcherButtons = (dar, showResearcher, history) => {
    const referenceId = dar.referenceId;
    return div({
      key: `researcher-buttons-${referenceId}`,
      style: {margin: "0 15px 8px"},
      className: "bonafide-icon" ,
      isRendered: showResearcher
    }, [
      a({
        id: dar.referenceId + "_flagBonafide",
        key: dar.referenceId + "_flagBonafide",
        name: "flag_bonafide",
        onClick: () => goToResearcherReview(history,dar.userId)
      }, [
        span({
          className: "glyphicon glyphicon-thumbs-up dataset-color",
          key: `tip-bonafide-${referenceId}`,
          isRendered: researcher.status === 'approved',
          "data-tip": "Bonafide researcher",
          "data-for": "tip_bonafide"
        }),
        span({
          key: `tip-non-bonafide-${referenceId}`,
          className: "glyphicon glyphicon-thumbs-down cancel-color",
          isRendered: researcher.status === 'rejected',
          "data-tip": "Non-Bonafide researcher",
          "data-for": "tip_nonBonafide"
        }),
        span({
          key: `tip-pending-review-${referenceId}`,
          className: "glyphicon glyphicon-hand-right hover-color",
          isRendered: researcher.status === 'pending',
          "data-tip": "Researcher review pending",
          "data-for": "tip_pendingReview"
        }),
        span({
          key: `dismiss-${referenceId}`,
          className: "glyphicon glyphicon-hand-right dismiss-color",
          isRendered: researcher.status === null
        }),
      ])
    ]);
  };

  const template = (election, dar, votes, history, index, visibilityOptions, baseStyle) => {
    const darReferenceId = dar.referenceId;
    const currentUserId = Storage.getCurrentUser().dacUserId;
    const targetVotes = filter((v) => {
      const belongsToUser = (currentUserId === v.dacUserId);
      const targetTypes = (v.type === 'Chairperson' || v.type === 'DAC');
      return belongsToUser && targetTypes;
    })(votes);

    return ([
      div({style: baseStyle}, [
        h(DarTableVoteButton, {
          election,
          history,
          darReferenceId,
          disabled: isEmpty(targetVotes),
          isRendered: visibilityOptions.showVote && isElectionOpen(election)
        }),
        h(DarTableCancelButton, {
          election,
          darReferenceId,
          index,
          updateLists,
          isIcon: visibilityOptions.showCancelIcon,
          isRendered: isElectionOpen(election),
          disabled: isNil(chairVote) && consoleType === 'chair'
        }),
        h(DarTableOpenButton, {
          dar,
          index,
          openConfirmation,
          label: 'Open',
          isRendered: !isElectionOpen(election),
          disabled: isNil(chairVote) && consoleType === 'chair'
        }),
        createResearcherButtons(dar, visibilityOptions.showResearcher, history),
        h(ReactTooltip, {
          id: "tip_flag",
          place: 'right',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper',
        }),
        h(ReactTooltip, {
          id: "tip_bonafide",
          place: 'left',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: "tip_pendingReview",
          place: 'left',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: "tip_nonBonafide",
          place: 'left',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
      ])
    ]);
  };

  return template(election, dar, votes, history, index, visibilityOptions, baseStyle);
}