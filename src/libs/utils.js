import Noty from 'noty';
import 'noty/lib/noty.css';
import 'noty/lib/themes/bootstrap-v3.css';
import { forEach } from 'lodash';
import { DAR, DataSet } from "./ajax";
import {Theme, Styles } from "./theme";
import { find, first, map, isEmpty, filter, cloneDeep, isNil, toLower, includes, sortedUniq, every} from "lodash/fp";
import _ from 'lodash';
import {User} from "./ajax";

export const UserProperties = {
  ACADEMIC_EMAIL: "academicEmail",
  ADDRESS1: "address1",
  ADDRESS2: "address2",
  CHECK_NOTIFICATIONS: "checkNotifications",
  CITY: "city",
  COMPLETED: "completed",
  COUNTRY: "country",
  DEPARTMENT: "department",
  DIVISION: "division",
  ERA_AUTHORIZED: "eraAuthorized",
  ERA_EXPIRATION: "eraExpiration",
  HAVE_PI: "havePI",
  IS_THE_PI: "isThePI",
  LINKEDIN : "linkedIn",
  ORCID: "orcid",
  PI_EMAIL: "piEmail",
  PI_NAME: "piName",
  PUBMED_ID: "pubmedID",
  RESEARCHER_GATE: "researcherGate",
  SCIENTIFIC_URL: "scientificURL",
  STATE: "state",
  ZIPCODE: "zipcode"
};

export const nonCancellableCollectionStatuses = ['Canceled', 'Under Election'];

export const determineCollectionStatus = (collection) => {
  const { electionMap } = collection;
  return !isEmpty(electionMap) ?
    'Under Election' :
    isCollectionCanceled(collection) ? 'Canceled' : 'Submitted';
};

export const isCollectionCanceled = (collection) => {
  const { dars } = collection;
  return every((dar) => toLower(dar.data.status) === 'canceled')(dars);
};

export const goToPage = (value, pageCount, setCurrentPage) => {
  if(value >= 1 && value <= pageCount) {
    setCurrentPage(value);
  }
};

export const findPropertyValue = (propName, researcher) => {
  const prop = isNil(researcher.researcherProperties) ?
    null
    : find({ propertyKey: propName })(researcher.researcherProperties);
  return isNil(prop) ? "" : prop.propertyValue;
};

export const getPropertyValuesFromUser = (user) => {
  let researcherProps = {
    academicEmail: findPropertyValue(UserProperties.ACADEMIC_EMAIL, user),
    address1: findPropertyValue(UserProperties.ADDRESS1, user),
    address2: findPropertyValue(UserProperties.ADDRESS2, user),
    department: findPropertyValue(UserProperties.DEPARTMENT, user),
    division: findPropertyValue(UserProperties.DIVISION, user),
    checkNotifications: findPropertyValue(UserProperties.CHECK_NOTIFICATIONS, user),
    city: findPropertyValue(UserProperties.CITY, user),
    country: findPropertyValue(UserProperties.COUNTRY, user),
    completed: findPropertyValue(UserProperties.COMPLETED, user),
    eraAuthorized: findPropertyValue(UserProperties.ERA_AUTHORIZED, user),
    eraCommonsId: user.eraCommonsId,
    eraExpiration: findPropertyValue(UserProperties.ERA_EXPIRATION, user),
    havePI: findPropertyValue(UserProperties.HAVE_PI, user),
    isThePI: findPropertyValue(UserProperties.IS_THE_PI, user),
    linkedIn: findPropertyValue(UserProperties.LINKEDIN, user),
    orcid: findPropertyValue(UserProperties.ORCID, user),
    piName: findPropertyValue(UserProperties.IS_THE_PI, user) === "true" ? user.displayName : findPropertyValue(UserProperties.PI_NAME, user),
    piEmail: findPropertyValue(UserProperties.IS_THE_PI, user) === "true" ? user.email : findPropertyValue(UserProperties.PI_EMAIL, user),
    pubmedID: findPropertyValue(UserProperties.PUBMED_ID, user),
    researcherGate: findPropertyValue(UserProperties.RESEARCHER_GATE, user),
    scientificURL: findPropertyValue(UserProperties.SCIENTIFIC_URL, user),
    state: findPropertyValue(UserProperties.STATE, user),
    zipcode: findPropertyValue(UserProperties.ZIPCODE, user)
  };

  return researcherProps;
};

export const applyHoverEffects = (e, style) => {
  forEach(style, (value, key) => {
    e.target.style[key] = value;
  });
};

export const highlightExactMatches = (highlightedWords, content) => {
  const regexWords = highlightedWords.map(w => '\\b' + w + '\\b');
  const regexString = '(' + regexWords.join('|') + ')';
  const regex = new RegExp(regexString, 'gi');
  return content.replace(regex, "<span style=\"background-color: yellow\">$1</span>");
};

//currently, dars contain a list of datasets (any length) and a list of length 1 of a datasetId
//go through the list of datasets and get the name of the dataset whose id is in the datasetId list
export const getNameOfDatasetForThisDAR = (datasets, datasetId) => {
  const data = !isNil(datasetId) && !isEmpty(datasetId) ? find({"value" : first(datasetId).toString()})(datasets) : null;
  return isNil(data) ? '- -' : getDatasetNames([data]);
};

export const formatDate = (dateval) => {
  if (dateval === null || dateval === undefined) {
    return '---';
  }

  let dateFormat = new Date(dateval);
  let year = dateFormat.getFullYear();
  let month = ('0' + (dateFormat.getMonth() + 1)).slice(-2);
  let day = ('0' + dateFormat.getDate()).slice(-2);
  let datestr = year + '-' + month + '-' + day;
  return datestr;
};

//Custom empty check needed on File
//lodash's isEmpty checks for enumerated keys, something a File does not have (ends up being an empty array)
//leads to incorrect evaluation of File
export const isFileEmpty = (file) => {
  return isNil(file) || file.size < 1 || file.length < 1;
};

export const USER_ROLES = {
  admin: 'Admin',
  chairperson: 'Chairperson',
  member: 'Member',
  researcher: 'Researcher',
  alumni: 'Alumni',
  dataOwner: 'DataOwner',
  signingOfficial: 'SigningOfficial',
  all: 'All'
};

export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

export const getDatasetNames = (datasets) => {
  if(!datasets){return '';}
  const datasetNames = datasets.map((dataset) => {
    return ((dataset.label) ?  dataset.label : dataset.name);
  });
  return datasetNames.join('\n');
};

export const getDatasets = async (darDetails) => {
  let datasets;
  await DataSet.getDarDatasets(darDetails.datasetIds).then((resp) => {
    datasets = resp;
  });
  datasets = datasets.map((dataset) => {
    return find({"propertyName":"Dataset Name"})(dataset.properties);
  });
  datasets = map(prop => prop.propertyValue)(datasets);
  return datasets;
};

export const applyTextHover = (e) => {
  e.target.style.color = Styles.TABLE.DAR_TEXT_HOVER.color;
  e.target.style.cursor = Styles.TABLE.DAR_TEXT_HOVER.cursor;
};

export const removeTextHover = (e, color) => {
  e.target.style.color = color;
};

export const setUserRoleStatuses = (user, Storage) => {
  const currentUserRoles = user.roles.map(roles => roles.name);
  user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
  user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
  user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
  user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
  user.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
  user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
  user.isSigningOfficial = currentUserRoles.indexOf(USER_ROLES.signingOfficial) > -1;
  Storage.setCurrentUser(user);
  return user;
};

export const Navigation = {
  back: async (user, history) => {
    const page = user.isChairPerson ? '/chair_console'
      : user.isMember ? '/member_console'
        : user.isAdmin ? '/admin_console'
          : user.isResearcher ? '/dataset_catalog'
            : user.isDataOwner ? '/data_owner_console'
              : user.isAlumni ? '/summary_votes'
                : '/';
    history.push(page);
  },
  console: async (user, history) => {
    const page = user.isChairPerson ? '/chair_console'
      : user.isMember ? '/member_console'
        : user.isAdmin ? '/admin_console'
          : user.isResearcher ? '/researcher_console'
            : user.isDataOwner ? '/data_owner_console'
              : user.isAlumni ? '/summary_votes'
                : '/';
    history.push(page);
  }
};

export const download = (fileName, text) => {
  const break_line = '\r\n \r\n';
  text = break_line + text;
  let blob = new Blob([text], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = fileName + '-restriction';
  a.click();
};

export const Notifications = {
  defaultNotification: {
    layout: 'bottomRight',
    timeout: '3500',
    progressBar: false,
    type: 'error',
    theme: 'bootstrap-v3',
  },
  /**
   * @param props: pass in properties like 'text', 'timeout', 'layout', and 'progressBar'.
   * See https://ned.im/noty/#/options for more customization options.
   */
  showError: props => {
    return new Noty({
      text: 'Something went wrong. Please try again.',
      ...Notifications.defaultNotification,
      ...props,
    }).show();
  },
  /**
   * @param props: pass in properties like 'text', 'timeout', 'layout', and 'progressBar'.
   * See https://ned.im/noty/#/options for more customization options.
   */
  showSuccess: props => {
    return new Noty({
      text: 'Congratulations',
      ...Notifications.defaultNotification,
      ...props,
      type: 'success',
    }).show();
  },
  showWarning: props => {
    return new Noty({
      text: 'Warning!',
      ...Notifications.defaultNotification,
      ...props,
      type: 'warning',
    }).show();
  },
  showInformation: props => {
    return new Noty({
      text: 'Information',
      ...Notifications.defaultNotification,
      ...props,
      type: 'information',
    }).show();
  },
};

export const NavigationUtils = {
  accessReviewPath: () => {
    return "access_review";
  }
};

//get information on datasets, consent, researcher, and access request
export const getDarData = async (darId) => {
  let datasets;
  let darInfo;
  let consent;
  let researcherProfile;

  try {
    darInfo = await DAR.getPartialDarRequest(darId);
    const researcherPromise = await User.getById(darInfo.userId);
    const datasetsPromise = darInfo.datasetIds.map((id) => {
      return DataSet.getDataSetsByDatasetId(id);
    });
    const consentPromise = await DAR.getDarConsent(darId);
    [consent, datasets, researcherProfile] = await Promise.all([
      consentPromise,
      Promise.all(datasetsPromise),
      researcherPromise
    ]);

  } catch (error) {
    Notifications.showError({text: 'Error retrieving Data Access Request information, please contact support.'});
    return Promise.reject(error);
  }

  return {datasets, darInfo, consent, researcherProfile};
};

/**
 * Serialize the execution of an array of promise functions
 *
 * See https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
 * @param funcs: List of functions that return a promise
 * @returns Array of promise results
 * @constructor
 */
export const PromiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result =>
      func().then(Array.prototype.concat.bind(result))),
  Promise.resolve([]));

//////////////////////////////////
//DAR CONSOLES UTILITY FUNCTIONS//
/////////////////////////////////
export const getElectionDate = (election) => {
  let formattedString = '- -';
  if(election) {
    //NOTE: some elections have a createDate attribute but not a lastUpdate attributes
    const targetDate = election.lastUpdate || election.createDate;
    formattedString = formatDate(targetDate);
  }
  return formattedString;
};

export const wasVoteSubmitted =(vote) => {
  //NOTE: as mentioned elsewhere, legacy code has resulted in multiple sources for timestamps
  //current code will always provide lastUpdate
  const targetDate = vote.lastUpdate || vote.createDate || vote.updateDate || vote.lastUpdateDate;
  return !isNil(targetDate);
};

export const wasFinalVoteTrue = (voteData) => {
  const {type, vote} = voteData;
  //vote status capitalizes final, election status does not
  return type === 'FINAL' && vote === true;
};

export const processElectionStatus = (election, votes, showVotes) => {
  let output;
  const electionStatus = election ? election.status : null;
  if (isNil(electionStatus)) {
    output = 'Unreviewed';
  } else if(electionStatus === 'Open') {
    //Null check since react doesn't necessarily perform prop updates immediately
    if(!isEmpty(votes) && !isNil(election)) {
      const dacVotes = filter((vote) => vote.type === 'DAC' && vote.electionId === election.electionId)(votes);
      const completedVotes = (filter(wasVoteSubmitted)(dacVotes)).length;
      const outputSuffix = `(${completedVotes} / ${dacVotes.length} votes)`;
      output = `Open${showVotes ? outputSuffix : ''}`;
    }
  //some elections have electionStatus === Final, others have electionStatus === Closed
  //both are, in this step of the process, technically referring to a closed election
  //therefore both values must be checked for
  } else if (electionStatus === 'Final' || electionStatus === 'Closed') {
    const finalVote = find(wasFinalVoteTrue)(votes);
    output = finalVote ? 'Approved' : 'Denied';
  } else {
    output = electionStatus;
  }
  return output;
};

export const calcFilteredListPosition = (index, currentPage, tableSize) => {
  return index + ((currentPage - 1) * tableSize);
};

export const calcTablePageCount = (tableSize, filteredList) => {
  if (isEmpty(filteredList)) {
    return 1;
  }
  return Math.ceil(filteredList.length / tableSize);
};

export const calcVisibleWindow = (currentPage, tableSize, filteredList) => {
  if (!isEmpty(filteredList)) {
    const startIndex = (currentPage - 1) * tableSize;
    const endIndex = currentPage * tableSize;
    return filteredList.slice(startIndex, endIndex);
  }
};

export const updateLists = (filteredList, setFilteredList, electionList, setElectionList, currentPage, tableSize) => {
  return (updatedElection, darId, i, successText, votes = undefined) => {
    const index = calcFilteredListPosition(i, currentPage, tableSize);
    let filteredListCopy = cloneDeep(filteredList);
    let electionListCopy = cloneDeep(electionList);
    const targetFilterRow = filteredListCopy[index];
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
};

//Helper function, search bar handler for DAC Chair console and AdminManageAccess
//NOTE: need to replace this in favor of the generic function. Will remove once substitutions in code is completed
export const darSearchHandler = (electionList, setFilteredList, setCurrentPage) => {
  return (searchTerms) => {
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
            const targetDarAttrs = !isNil(dar) ? JSON.stringify([toLower(dar.projectTitle), toLower(dar.darCode), toLower(getNameOfDatasetForThisDAR(dar.datasets, dar.datasetIds))]) : [];
            const targetDacAttrs = !isNil(dac) ? JSON.stringify([toLower(dac.name)]) : [];
            const targetElectionAttrs = JSON.stringify([toLower(processElectionStatus(election, votes)), getElectionDate(election)]);
            return includes(term, targetDarAttrs) || includes(term, targetDacAttrs) || includes(term, targetElectionAttrs);
          }, newFilteredList);
        }
      });
      setFilteredList(newFilteredList);
    }
    setCurrentPage(1);
  };
};

export const getSearchFilterFunctions = () => {
  return {
    dar: (term, targetList) => filter(electionData => {
      const { election, dac, votes} = electionData;
      const dar = electionData.dar ? electionData.dar.data : undefined;
      const targetDarAttrs = !isNil(dar) ? JSON.stringify([toLower(dar.projectTitle), toLower(dar.darCode), toLower(getNameOfDatasetForThisDAR(dar.datasets, dar.datasetIds))]) : [];
      const targetDacAttrs = !isNil(dac) ? JSON.stringify([toLower(dac.name)]) : [];
      const targetElectionAttrs = !isNil(election) ? JSON.stringify([toLower(processElectionStatus(election, votes)), getElectionDate(election)]) : [];
      return includes(term, targetDarAttrs) || includes(term, targetDacAttrs) || includes(term, targetElectionAttrs);
    }, targetList),
    libraryCard: (term, targetList) => filter(libraryCard => {
      const { userName, institution, createDate, updateDate, eraCommonsId, userEmail} = libraryCard;
      const institutionName = institution.name;
      return includes(term, toLower(userName)) ||
        includes(term, toLower(institutionName)) ||
        includes(term, formatDate(createDate)) ||
        includes(term, formatDate(updateDate)) ||
        includes(term, toLower(userEmail)) ||
        includes(term, toLower(eraCommonsId));
    }, targetList),
    signingOfficialResearchers: (term, targetList) => filter(researcher => {
      const { displayName, eraCommonsId, email } = researcher;
      const roles = researcher.roles || [];
      const baseAttributes = [displayName, eraCommonsId, email];
      const includesRoles = roles.reduce((memo, current) => {
        const roleName = current.name;
        return memo || includes(term, toLower(roleName));
      }, false);

      const includesBaseAttributes = baseAttributes.reduce(
        (memo, current) => {
          return memo || includes(term, toLower(current));
        }, false);

      return includesRoles || includesBaseAttributes;
    })(targetList),
    darCollections: (term, targetList) => filter(collection => {
      const { darCode } = collection;
      const referenceDar = collection.dars[0];
      const { createDate, data } = referenceDar;
      const { projectTitle } = data;
      const status = determineCollectionStatus(collection);
      const matched = find((phrase) =>
        includes(term, toLower(phrase))
      )([darCode, formatDate(createDate), projectTitle, status]);
      return !isNil(matched);
    })(targetList)
  };
};

export const tableSearchHandler = (list, setFilteredList, setCurrentPage, modelName) => {
  const filterFnMap = getSearchFilterFunctions();
  return (searchTerms) => {
    const searchTermValues = toLower(searchTerms.current.value).split(/\s|,/);
    if(isEmpty(searchTermValues)) {
      setFilteredList(list);
    } else {
      let newFilteredList = cloneDeep(list);
      searchTermValues.forEach((splitTerm) => {
        const term = splitTerm.trim();
        if(!isEmpty(term)) {
          const filterFn = filterFnMap[modelName];
          newFilteredList = filterFn(term, newFilteredList);
        }
      });
      setFilteredList(newFilteredList);
    }
    setCurrentPage(1);
  };
};

export const userSearchHandler = (userList, setFilteredList, setCurrentPage) => {
  return (searchTerms) => {
    const searchTermValues = toLower(searchTerms.current.value).split(/\s|,/);
    if(isEmpty(searchTermValues)) {
      setFilteredList(userList);
    } else {
      let newFilteredList = cloneDeep(userList);
      searchTermValues.forEach((splitTerm) => {
        const term = splitTerm.trim();
        if(!isEmpty(term)) {
          newFilteredList = filter(user => {
            const roles = sortedUniq(map(role => role.name)(user.roles));
            const targetUserAttrs = !isNil(user) ? JSON.stringify([toLower(user.displayName), toLower(user.email), toLower(roles)]) : [];
            return includes(term, targetUserAttrs);
          }, newFilteredList);
        }
      });
      setFilteredList(newFilteredList);
    }
    setCurrentPage(1);
  };
};

export const searchOntologies = (query, callback) => {
  let options = [];
  DAR.getAutoCompleteOT(query).then(
    items => {
      options = items.map(function(item) {
        return {
          key: item.id,
          value: item.id,
          label: item.label,
          item: item,
        };
      });
      callback(options);
    });
};

export const setStyle = (disabled, baseStyle, targetColorAttribute) => {
  let appliedStyle = disabled ? {[targetColorAttribute] : Theme.palette.disabled} : {};
  return Object.assign(baseStyle, appliedStyle);
};

export const setDivAttributes = (disabled, onClick, style, dataTip, onMouseEnter, onMouseLeave, key) => {
  let attributes;
  if(!disabled) {
    attributes = {onClick, onMouseEnter, onMouseLeave, style, "data-tip": dataTip, key};
  } else {
    attributes = {style, disabled, "data-tip": dataTip, key};
  }
  if(!isEmpty(dataTip)) {
    attributes["data-tip"] = dataTip;
  }
  return attributes;
};

export const getColumnSort = (getList, callback) => {
  return ({ sortKey, getValue, descendantOrder = false } = {}) => () => {
    let data = getList();
    let sortedData = data.sort(function (a, b) {
      if (isNil(a) || isNil(b)) {
        return 0;
      }

      const aVal = getValue ? getValue(a) : _.get(a, sortKey);
      const bVal = getValue ? getValue(b) : _.get(b, sortKey);
      if (isNil(aVal) || isNil(bVal)) {
        return 0;
      }

      const varA = (typeof aVal === 'string') ?
        aVal.toLowerCase() : aVal;

      const varB = (typeof bVal === 'string') ?
        bVal.toLowerCase() : bVal;

      let comparison = 0;

      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return (descendantOrder) ? (comparison * -1) : comparison;
    });

    callback(sortedData, descendantOrder);
  };
};

//Functions that are commonly used between tables//
export const recalculateVisibleTable = async ({
  tableSize, pageCount, filteredList, currentPage, setPageCount, setCurrentPage, setVisibleList
}) => {
  try {
    setPageCount(calcTablePageCount(tableSize, filteredList));
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
    const visibleList = calcVisibleWindow(
      currentPage,
      tableSize,
      filteredList
    );
    setVisibleList(visibleList);
  } catch (error) {
    Notifications.showError({ text: 'Error updating Library Card table' });
  }
};

export const searchOnFilteredList = (searchTerms, originalList, filterFn, setFilteredList) => {
  let searchList = originalList;
  if(!isEmpty(searchTerms)) {
    const terms = searchTerms.split(' ');
    terms.forEach((term => searchList = filterFn(term, searchList)));
  }
  setFilteredList(searchList);
};

