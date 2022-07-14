import Noty from 'noty';
import 'noty/lib/noty.css';
import 'noty/lib/themes/bootstrap-v3.css';
import {map as nonFPMap} from 'lodash';
import { DAR, DataSet } from './ajax';
import {Theme, Styles } from './theme';
import { each, flatMap, flatten, flow, forEach, get, getOr, indexOf, uniq, values, find, first, map, isEmpty, filter, cloneDeep, isNil, toLower, includes, sortedUniq, every, pick, capitalize } from 'lodash/fp';
import {User} from './ajax';
import {Config} from './config';

export const UserProperties = {
  ACADEMIC_EMAIL: 'academicEmail',
  ADDRESS1: 'address1',
  ADDRESS2: 'address2',
  CHECK_NOTIFICATIONS: 'checkNotifications',
  CITY: 'city',
  COMPLETED: 'completed',
  COUNTRY: 'country',
  DEPARTMENT: 'department',
  DIVISION: 'division',
  ERA_AUTHORIZED: 'eraAuthorized',
  ERA_EXPIRATION: 'eraExpiration',
  HAVE_PI: 'havePI',
  IS_THE_PI: 'isThePI',
  LINKEDIN : 'linkedIn',
  ORCID: 'orcid',
  PI_EMAIL: 'piEmail',
  PI_NAME: 'piName',
  PI_ERA_COMMONS_ID: 'piERACommonsID',
  PUBMED_ID: 'pubmedID',
  RESEARCHER_GATE: 'researcherGate',
  SCIENTIFIC_URL: 'scientificURL',
  STATE: 'state',
  ZIPCODE: 'zipcode'
};

///////DAR Collection Utils///////////////////////////////////////////////////////////////////////////////////
export const isCollectionCanceled = (collection) => {
  const { dars } = collection;
  return every((dar) => toLower(dar.data.status) === 'canceled')(dars);
};

export const darCollectionUtils = {
  nonCancellableCollectionStatuses: ['Canceled', 'Under Election'],
  //this needs to be defined outside of the object, keys can't reference other key/value pairs on object initialization,
  //determineCollectionStatus uses this function so its definition/reference needs to exist
  isCollectionCanceled,
  determineCollectionStatus: (collection, relevantDatasets) => {
    const electionStatusCount = {};
    let output;
    if(!isEmpty(collection.dars)) {
      const targetElections = flow([
        map((dar) => {
          const { elections } = dar;
          //election is empty => no elections made for dar
          //need to figure out if dar is relevant, can obtain datasetId from dar.data
          //see if its relevant, if it is, add 1 to submitted on hash
          //return empty array at the end
          if(isEmpty(elections)) {
            const datasetIds = (isEmpty(dar.data) || isEmpty(dar.data.datasetIds)) ? [-1] : dar.data.datasetIds;
            forEach((datasetId) => {
              if(includes(relevantDatasets, datasetId)) {
                if(isNil(electionStatusCount['Submitted'])) {
                  electionStatusCount['Submitted'] = 0;
                }
                electionStatusCount['Submitted']++;
              }
            })(datasetIds);
            return [];
          } else {
            //if elections exist, filter out elections based on relevant ids
            //only Data Access elections impact the status of the collection
            //NOTE: Admin does not have relevantIds, DAC roles do
            const electionArr = filter(election => toLower(election.electionType) === 'dataaccess')(Object.values(elections));
            if(isNil(relevantDatasets)) {
              return electionArr;
            } else {
              const relevantIds = map(dataset => dataset.dataSetId)(relevantDatasets);
              return filter(election => includes(election.dataSetId, relevantIds))(electionArr);
            }
          }
        }),
        flatten
      ])(collection.dars);

      if(isNil(relevantDatasets)) {
        each(election => {
          const {status} = election;
          if(isNil(electionStatusCount[status])) {
            electionStatusCount[status] = 0;
          }
          electionStatusCount[status]++;
        })(targetElections);
        output = nonFPMap(electionStatusCount, (value, key) => {
          return `${key}: ${value}`;
        }).join('\n');
      } else {
        output = outputCommaSeperatedElectionStatuses(targetElections);
      }
      return output;
    }
  }
};
///////DAR Collection Utils END/////////////////////////////////////////////////////////////////////////////////

export const goToPage = (value, pageCount, setCurrentPage) => {
  if(value >= 1 && value <= pageCount) {
    setCurrentPage(value);
  }
};

export const findPropertyValue = (propName, researcher) => {
  const prop = isNil(researcher.researcherProperties) ?
    null
    : find({ propertyKey: propName })(researcher.researcherProperties);
  return isNil(prop) ? '' : prop.propertyValue;
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
    piName: findPropertyValue(UserProperties.IS_THE_PI, user) === 'true' ? user.displayName : findPropertyValue(UserProperties.PI_NAME, user),
    piEmail: findPropertyValue(UserProperties.IS_THE_PI, user) === 'true' ? user.email : findPropertyValue(UserProperties.PI_EMAIL, user),
    piERACommonsID: findPropertyValue(UserProperties.PI_ERA_COMMONS_ID, user),
    pubmedID: findPropertyValue(UserProperties.PUBMED_ID, user),
    researcherGate: findPropertyValue(UserProperties.RESEARCHER_GATE, user),
    scientificURL: findPropertyValue(UserProperties.SCIENTIFIC_URL, user),
    state: findPropertyValue(UserProperties.STATE, user),
    zipcode: findPropertyValue(UserProperties.ZIPCODE, user)
  };

  researcherProps.institutionId = user.institutionId;
  return researcherProps;
};

export const applyHoverEffects = (e, style) => {
  forEach((key, value) => {
    e.target.style[key] = value;
  })(style);
};

export const highlightExactMatches = (highlightedWords, content) => {
  const regexWords = highlightedWords.map(w => '\\b' + w + '\\b');
  const regexString = '(' + regexWords.join('|') + ')';
  const regex = new RegExp(regexString, 'gi');
  return content.replace(regex, '<span style=\'background-color: yellow\'>$1</span>');
};

//currently, dars contain a list of datasets (any length) and a list of length 1 of a datasetId
//go through the list of datasets and get the name of the dataset whose id is in the datasetId list
export const getNameOfDatasetForThisDAR = (datasets, datasetId) => {
  const data = !isNil(datasetId) && !isEmpty(datasetId) ? find({'value' : first(datasetId).toString()})(datasets) : null;
  return isNil(data) ? '- -' : getDatasetNames([data]);
};

export const formatDate = (dateval) => {
  if (dateval === null || dateval === undefined) {
    return '---';
  }

  if(toLower(dateval) === 'unsubmitted') {return dateval;}

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

export const isEmailAddress = (email) => {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return re.test(email);
};

export const USER_ROLES = {
  admin: 'Admin',
  chairperson: 'Chairperson',
  member: 'Member',
  researcher: 'Researcher',
  alumni: 'Alumni',
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
    return find({'propertyName':'Dataset Name'})(dataset.properties);
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

//helper function to generate keys for rendered elements; splits on commas and whitespace
export const convertLabelToKey = (label = '') => {
  return label.split(/[\s,]+/) .join('-');
};

export const setUserRoleStatuses = (user, Storage) => {
  const currentUserRoles = user.roles.map(roles => roles.name);
  user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
  user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
  user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
  user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
  user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
  user.isSigningOfficial = currentUserRoles.indexOf(USER_ROLES.signingOfficial) > -1;
  Storage.setCurrentUser(user);
  return user;
};

export const Navigation = {
  back: async (user, history) => {
    const env = await Config.getEnv();
    let page;
    if (env !== 'prod') {
      page =
        user.isAdmin ? '/admin_manage_dar_collections'
          :user.isChairPerson ? '/new_chair_console'
            : user.isMember ? '/new_member_console'
              : user.isResearcher ? '/dataset_catalog'
                : user.isDataOwner ? '/data_owner_console'
                  : user.isAlumni ? '/summary_votes'
                    : '/';
    } else {
      page =
        user.isAdmin ? '/admin_manage_dar_collections'
          :user.isChairPerson ? '/new_chair_console'
            : user.isMember ? '/new_member_console'
              : user.isResearcher ? '/dataset_catalog'
                : user.isDataOwner ? '/data_owner_console'
                  : user.isAlumni ? '/summary_votes'
                    : '/';
    }
    history.push(page);
  },
  console: async (user, history) => {
    const env = await Config.getEnv();
    let page;
    if (env !== 'prod') {
      page =
        user.isAdmin ? '/admin_manage_dar_collections'
          : user.isChairPerson ? '/new_chair_console'
            : user.isMember ? '/new_member_console'
              : user.isResearcher ? '/new_researcher_console'
                : user.isDataOwner ? '/data_owner_console'
                  : user.isAlumni ? '/summary_votes'
                    : '/';
    } else {
      page =
          user.isAdmin ? '/admin_manage_dar_collections'
            : user.isChairPerson ? '/new_chair_console'
              : user.isMember ? '/new_member_console'
                : user.isResearcher ? '/new_researcher_console'
                  : user.isDataOwner ? '/data_owner_console'
                    : user.isAlumni ? '/summary_votes'
                      : '/';
    }
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
    return 'access_review';
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

export const outputCommaSeperatedElectionStatuses = (elections) => {
  // find all statuses that exist for all the user's elections
  const statuses = uniq(
    elections.map((e) => processElectionStatus(e, e.votes, false))
  ).filter((status) => !isEmpty(status));
  if (isEmpty(statuses)) {
    return 'Unreviewed';
  }
  return statuses.join(', ');
};

// Returns a comma separated list of states for all elections the user has
// access to in a DAR Collection
export const processCollectionElectionStatus = (collection, user) => {
  // Filter elections for my DACs by looking for elections with votes that have my user id
  const filteredElections = filterCollectionElectionsByUser(collection, user);
  return outputCommaSeperatedElectionStatuses(filteredElections);
};

// Filter elections in a DAR Collection by which ones the user has votes in
export const filterCollectionElectionsByUser = (collection, user) => {
  const {dars} = collection;
  // 'dars' is a map of referenceId -> full DAR object
  const darValues = values(dars);
  // 'elections' is a map of election id -> full Election object
  const electionMaps = map('elections')(darValues);
  // electionValues is a list of actual election objects
  const electionValues = flatMap((e) => { return values(e); })(electionMaps);
  // Filter elections for my DACs by looking for elections with votes that have my user id
  return filter(e => {
    // Votes is a map of vote id -> full Vote object
    const voteMap = getOr({}, 'votes')(e);
    const voteUserIds = map('dacUserId')(values(voteMap));
    // If there is a vote for this user, then this is a valid election
    return indexOf(user.userId)(voteUserIds) >= 0;
  })(electionValues);
};

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
  return toLower(type) === 'final' && vote === true;
};

export const processElectionStatus = (election, votes, showVotes) => {
  let output;
  const electionStatus = !isNil(get('status')(election))  ? toLower(election.status) : null;
  if (isNil(electionStatus)) {
    output = 'Unreviewed';
  } else if(electionStatus === 'open') {
    //Null check since react doesn't necessarily perform prop updates immediately
    if(!isEmpty(votes) && !isNil(election)) {
      const dacVotes = filter((vote) => toLower(vote.type) === 'dac' && vote.electionId === election.electionId)(votes);
      const completedVotes = (filter(wasVoteSubmitted)(dacVotes)).length;
      const outputSuffix = `(${completedVotes} / ${dacVotes.length} votes)`;
      output = `Open${showVotes ? outputSuffix : ''}`;
    }
  //some elections have electionStatus === Final, others have electionStatus === Closed
  //both are, in this step of the process, technically referring to a closed election
  //therefore both values must be checked for
  } else if (electionStatus === 'final' || electionStatus === 'closed') {
    const finalVote = find(wasFinalVoteTrue)(votes);
    output = finalVote ? 'Approved' : 'Denied';
  } else {
    output = capitalize(electionStatus);
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
    darCollections: (term, targetList) =>
      isEmpty(term) ? targetList :
        filter(collection => {
          if(isEmpty(term)) {return true;}
          let projectTitle, institution, createDate;
          if(collection.isDraft) {
            projectTitle = collection.projectTitle;
            createDate = collection.createDate;
            institution = collection.institution;
          } else {
            const referenceDar = find((dar) => !isEmpty(dar.data))(
              collection.dars
            );
            const { data } = referenceDar;
            projectTitle = data.projectTitle;
            institution = data.institution;
          }
          const datasetCount = !isEmpty(collection.datasets) ? collection.datasets.length.toString() : '0';
          const lowerCaseTerm = toLower(term);
          createDate = formatDate(collection.createDate);
          const { darCode, isDraft, createUser } = collection;
          const researcherName = get('displayName')(createUser);
          const status = toLower(isDraft ? collection.status : darCollectionUtils.determineCollectionStatus(collection)) || '';
          const matched = find((phrase) => {
            const termArr = lowerCaseTerm.split(' ');
            return find(term => includes(term, phrase))(termArr);
          })([datasetCount, toLower(darCode), toLower(createDate), toLower(projectTitle), toLower(status), toLower(institution), toLower(researcherName)]);
          return !isNil(matched);
        })(targetList),
    darDrafts: (term, targetList) => filter(draftRecord => {
      const lowerCaseTerm = toLower(term);
      const { data, draft, createDate, updateDate } = draftRecord;
      const { partialDarCode, projectTitle } = data;
      const matched = find((phrase) =>
        includes(lowerCaseTerm, toLower(phrase))
      )([partialDarCode, ...(projectTitle.split(' ')), (updateDate || createDate)]);
      return !isNil(matched) && (draft !== false || draft !== 'false');
    })(targetList)
  };
};

export const tableSearchHandler = (list, setFilteredList, setCurrentPage, modelName) => {
  const filterFnMap = getSearchFilterFunctions();
  return (searchTerms) => {
    const rawSearchTerms = getOr(searchTerms, 'current.value', searchTerms);
    const searchTermValues = toLower(rawSearchTerms).split(/\s|,/);
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
    attributes = {onClick, onMouseEnter, onMouseLeave, style, 'data-tip': dataTip, key, id: key};
  } else {
    attributes = {style, disabled, 'data-tip': dataTip, key};
  }
  if(!isEmpty(dataTip)) {
    attributes['data-tip'] = dataTip;
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

      const aVal = getValue ? getValue(a) : get(sortKey)(a);
      const bVal = getValue ? getValue(b) : get(sortKey)(b);
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

//each item in the list is an array of metadata representing a single table row
//the metadata for each cell needs a data (exactly what is displayed in the table)
//or value (string or number alternative) property which determines sorting
export const sortVisibleTable = ({ list = [], sort }) => {
  // Sort: { dir, colIndex }
  if (!sort || sort.colIndex === undefined) {
    return list;
  }
  else {
    return list.sort((a, b) => {
      const aVal = a[sort.colIndex].value || a[sort.colIndex].data;
      const bVal = b[sort.colIndex].value || b[sort.colIndex].data;
      if (typeof aVal === 'number') {
        return (aVal > bVal ? -1 : 1) * sort.dir;
      } else {
        return (aVal.localeCompare(bVal, 'en', { sensitivity: 'base', numeric: true }) * sort.dir);
      }
    });
  }
};

//Functions that are commonly used between tables//
export const recalculateVisibleTable = async ({
  tableSize, pageCount, filteredList, currentPage, setPageCount, setCurrentPage, setVisibleList, sort
}) => {
  try {
    // Sort data before applying paging
    if (sort) {
      filteredList = sortVisibleTable({ list: filteredList, sort });
    }

    // Set paging variables and truncate the list
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
    Notifications.showError({ text: 'Error updating table' });
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

export const getBooleanFromEventHtmlDataValue = (e) => {
  if (!isNil(e)) {
    if (!isNil(e.target)) {
      const dataValue = e.target.getAttribute('data-value');
      if (!isNil(dataValue)) {
        return dataValue.toLowerCase() === 'true';
      }
    }
  }
  return false;
};

export const evaluateTrueString = (boolString) => {
  return !isEmpty(boolString) && toLower(boolString) === 'true';
};

//helper method for ResearcherInfo component in DAR application page
export const completedResearcherInfoCheck = (properties) => {
  const {
    piName,
    isThePI,
    havePI,
    piEmail,
    institutionId,
  } = properties;

  const piCheck = ({isThePI, havePI, piEmail, piName}) => {
    //conditions listed are invalid checks
    //if all are true, value returned MUST be false, since pi portion of the form is incomplete
    const isThePIFalse = !evaluateTrueString(isThePI);
    const havePITrue = evaluateTrueString(havePI);
    const piAttrEmpty = isEmpty(piName) || isEmpty(piEmail);
    return !(isThePIFalse && havePITrue && piAttrEmpty);
  };

  const stringAttrs = pick(['displayName', 'address1', 'city', 'state', 'zipCode', 'country'])(properties);
  const stringAttrsCompleted = every((string) => !isEmpty(string))(stringAttrs);
  const institutionPresent = !isNil(institutionId);
  const piValid = piCheck({isThePI, havePI, piEmail, piName});
  return piValid && stringAttrsCompleted && institutionPresent;
};
