import { isEmpty, isNil, includes, toLower, filter, cloneDeep } from 'lodash/fp';
import { useState, useEffect, useRef } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import { DAR } from '../libs/ajax';
import SearchBar from '../components/SearchBar';
import { Notifications, getElectionDate, processElectionStatus } from '../libs/utils';
import { Styles} from '../libs/theme';
import DarTable from '../components/DarTable';
import lockIcon from '../images/lock-icon.png';

export default function NewChairConsole(props) {
  const [electionList, setElectionList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [tableSize, setTableSize] = useState();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const init = async() => {
      const initTableSize = 10;
      setTableSize(initTableSize);
      try {
        const pendingList = await DAR.getDataAccessManageV2();
        setElectionList(pendingList);
        setFilteredList(pendingList);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve data requests from server'});
      }
    };
    init();
  }, []);

  //NOTE: stays in parent, should be modified
  //element update done in child, parent will slice original and update element to trigger re-render
  const updateLists = (updatedElection, darId, index, successText, votes = undefined) => {
    const i = index + ((currentPage - 1) * tableSize);
    let filteredListCopy = cloneDeep(filteredList);
    let electionListCopy = cloneDeep(electionList);
    const targetFilterRow = filteredListCopy[parseInt(i, 10)];
    const targetElectionRow = electionListCopy.find((element) => element.dar.referenceId === darId);
    targetFilterRow.election = updatedElection;
    targetElectionRow.election = cloneDeep(updatedElection);
    if(!isNil(votes)) {
      targetFilterRow.votes = votes;
      targetElectionRow.votes = cloneDeep(votes);
    }
    setFilteredList(filteredListCopy);
    setElectionList(electionListCopy);
    Notifications.showSuccess({text: successText});
  };

  //NOTE: stays in parent, should be sent as prop to search bar
  const handleSearchChange = (searchTerms) => {
    setCurrentPage(1);
    const searchTermValues = toLower(searchTerms.current.value).split(/\s|,/);
    if(isEmpty(searchTermValues)) {
      setFilteredList(electionList);
    } else {
      let newFilteredList = cloneDeep(electionList);
      searchTermValues.forEach((splitTerm) => {
        const term = splitTerm.trim();
        if(!isEmpty(term)) {
          newFilteredList = filter(electionData => {
            const { election, dac, votes} = electionData;
            const dar = electionData.dar ? electionData.dar.data : undefined;
            const targetDarAttrs = !isNil(dar) ? JSON.stringify([toLower(dar.projectTitle), toLower(dar.darCode)]) : [];
            const targetDacAttrs = !isNil(dac) ? JSON.stringify([toLower(dac.name)]) : [];
            const targetElectionAttrs = !isNil(election) ? JSON.stringify([toLower(processElectionStatus(election, votes)), getElectionDate(election)]) : [];
            return includes(term, targetDarAttrs) || includes(term, targetDacAttrs) || includes(term, targetElectionAttrs);
          }, newFilteredList);
        }
      });
      setFilteredList(newFilteredList);
    }
  };

  return (
    div({style: Styles.PAGE}, [
      div({ style: {display: "flex", justifyContent: "space-between"}}, [
        div({className: "left-header-section", style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.ICON_CONTAINER}, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: Styles.TITLE}, ["DAC Chair Console"]),
            div({style: Styles.SMALL}, ["Select and manage Data Access Requests for DAC review"])
          ]),
        ]),
        h(SearchBar, {handleSearchChange})
      ]),
      h(DarTable, {updateLists, filteredList, history: props.history, processElectionStatus, getElectionDate}, [])
    ])
  );
}
