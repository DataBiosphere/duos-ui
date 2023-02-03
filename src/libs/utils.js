import Noty from 'noty';
import 'noty/lib/noty.css';
import 'noty/lib/themes/bootstrap-v3.css';
import {map as lodashMap, forEach as lodashForEach, isArray} from 'lodash';
import { DAR } from './ajax';
import {Theme } from './theme';
import { each, join, flatten, flow, forEach as lodashFPForEach, get, getOr, uniq, find, first, map, isEmpty, filter, cloneDeep, isNil, toLower, includes, every, capitalize } from 'lodash/fp';
import { headerTabsConfig } from '../components/DuosHeader';
import {DatasetService} from '../utils/DatasetService';

export const UserProperties = {
  SUGGESTED_SIGNING_OFFICIAL: 'suggestedSigningOfficial',
  SELECTED_SIGNING_OFFICIAL_ID: 'selectedSigningOfficialId',
  INSTITUTION_ID: 'institutionId',
  SUGGESTED_INSTITUTION: 'suggestedInstitution'
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
            // Dataset IDs should be on the DAR, but if not, pull from the dar.data
            const datasetIds = isNil(dar.datasetIds) ? dar.data.datasetIds : dar.datasetIds;
            lodashFPForEach((datasetId) => {
              if (includes(relevantDatasets, datasetId)) {
                if (isNil(electionStatusCount['Submitted'])) {
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
        output = lodashMap(electionStatusCount, (value, key) => {
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
    institutionId: findPropertyValue(UserProperties.INSTITUTION_ID, user),
    suggestedInstitution: findPropertyValue(UserProperties.SUGGESTED_INSTITUTION, user),
    selectedSigningOfficialId: findPropertyValue(UserProperties.SELECTED_SIGNING_OFFICIAL_ID, user),
    suggestedSigningOfficial: findPropertyValue(UserProperties.SUGGESTED_SIGNING_OFFICIAL, user)
  };

  researcherProps.institutionId = user.institutionId;
  return researcherProps;
};

export const applyHoverEffects = (e, style) => {
  lodashForEach(style, (value, key) => {
    e.target.style[key] = value;
  });
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
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return re.test(email);
};

export const USER_ROLES = {
  admin: 'Admin',
  chairperson: 'Chairperson',
  member: 'Member',
  researcher: 'Researcher',
  alumni: 'Alumni',
  signingOfficial: 'SigningOfficial',
  dataSubmitter: 'DataSubmitter',
  all: 'All'
};

export const getDatasetNames = (datasets) => {
  if(!datasets){return '';}
  const datasetNames = datasets.map((dataset) => {
    return ((dataset.label) ?  dataset.label : dataset.name);
  });
  return datasetNames.join('\n');
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
  user.isDataSubmitter = currentUserRoles.indexOf(USER_ROLES.dataSubmitter) > -1;
  Storage.setCurrentUser(user);
  return user;
};

export const Navigation = {
  back: async (user, history) => {
    const queryParams = new URLSearchParams(window.location.search);
    let firstConsole = headerTabsConfig.find(config => config.isRendered(user));
    let page =
      queryParams.get('redirectTo') ? queryParams.get('redirectTo')
        : firstConsole ? firstConsole.link
          : user.isAlumni ? '/summary_votes'
            : '/';
    history.push(page);
  },
  console: async (user, history) => {
    const queryParams = new URLSearchParams(window.location.search);
    let firstConsole = headerTabsConfig.find(config => config.isRendered(user));
    let page =
      queryParams.get('redirectTo') ? queryParams.get('redirectTo')
        : firstConsole ? firstConsole.link
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
          const {darCode, datasetCount, institutionName, name, researcherName, status, submissionDate} = collection;
          const formattedSubmissionDate = formatDate(submissionDate);
          const matched = find((phrase) => {
            const termArr = term.split(' ');
            return find(term => includes(toLower(term), toLower(phrase)))(termArr);
          })([darCode, datasetCount, institutionName, name, researcherName, status, formattedSubmissionDate]);
          return !isNil(matched);
        })(targetList),
    users: (term, targetList) => {
      const lowerCaseTerm = toLower(term);
      const isMatch = (userField) => includes(lowerCaseTerm, toLower(userField));

      return filter(user => {
        const {
          displayName, email, roles, institution, libraryCards
        } = user;

        const matchable = [displayName, email];
        if (!isNil(roles)) {
          matchable.push(...map((r) => r.name)(roles));
        }
        if (!isNil(institution)) {
          matchable.push(institution.name);
        }

        if (!isNil(libraryCards) && isArray(libraryCards)) {
          const hasLibraryCard = !isNil(libraryCards) && !isEmpty(libraryCards);

          if (hasLibraryCard) {
            matchable.push('LibraryCard');
          }
        }

        const match = find(isMatch)(matchable);
        return !isNil(match);
      })(targetList);
    },
    datasets: (term, targetList) => filter(dataset => {
      /**
       * This filter function assumes that the dataset has been
       * pre-populated with data use codes and translations
       */
      const alias = dataset.alias;
      const identifier = dataset.datasetIdentifier;
      const dataSubmitter = DatasetService.findDatasetPropertyValue(dataset.properties, 'Data Submitter');
      const datasetName = DatasetService.findDatasetPropertyValue(dataset.properties, 'Dataset Name');
      const dataDepositor = DatasetService.findDatasetPropertyValue(dataset.properties, 'Data Depositor');
      const dataCustodians = DatasetService.findDatasetPropertyValueList(dataset.properties, 'Data Custodian Email');
      // Approval status
      const status = !isNil(dataset.dacApproval)
        ? dataset.dacApproval
          ? 'accepted'
          : 'rejected'
        : 'yes no';
      const dataUse = dataset.codeList;
      return includes(term, toLower(alias)) ||
          includes(term, toLower(identifier)) ||
          includes(term, toLower(dataSubmitter)) ||
          includes(term, toLower(datasetName)) ||
          includes(term, toLower(dataDepositor)) ||
          includes(term, toLower(join(' ')(dataCustodians))) ||
          includes(term, toLower(dataUse)) ||
          includes(term, toLower(status));
    }, targetList),
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
      lodashFPForEach((splitTerm) => {
        const term = splitTerm.trim();
        if(!isEmpty(term)) {
          const filterFn = filterFnMap[modelName];
          newFilteredList = filterFn(term, newFilteredList);
        }
      })(searchTermValues);
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
  try {
    return Object.assign(baseStyle, appliedStyle);
  } catch (e) {
    return baseStyle;
  }
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
        if (aVal === null || bVal === null) {
          return (aVal > bVal ? -1 : 1) * sort.dir;
        } else {
          return (aVal.localeCompare(bVal, 'en', { sensitivity: 'base', numeric: true }) * sort.dir);
        }
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
  let searchList = (!isNil(originalList) ? [...originalList] : []);
  if(!isEmpty(searchTerms)) {
    const terms = searchTerms.split(' ');
    lodashFPForEach((term => searchList = filterFn(term, searchList)))(terms);
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
