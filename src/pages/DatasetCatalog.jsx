import {filter, find, flow, getOr, includes, isEmpty, isNil, isNull, map, isFunction} from 'lodash/fp';
import React, {Fragment, useEffect, useState, useCallback } from 'react';
import ReactTooltip from 'react-tooltip';
import {ConfirmationDialog} from '../components/ConfirmationDialog';
import TranslatedDulModal from '../components/modals/TranslatedDulModal';
import {PageHeading} from '../components/PageHeading';
import {PaginatorBar} from '../components/PaginatorBar';
import {SearchBox} from '../components/SearchBox';
import { DataSet } from '../libs/ajax/DataSet';
import { DAR } from '../libs/ajax/DAR';
import { DAC } from '../libs/ajax/DAC';
import {Storage} from '../libs/storage';
import {Theme} from '../libs/theme';
import {getBooleanFromEventHtmlDataValue, USER_ROLES} from '../libs/utils';
import {DataUseTranslation} from '../libs/dataUseTranslation';
import {spinnerService} from '../libs/spinner-service';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import DuosLogo from '../images/duos-network-logo.svg';
import style from './DatasetCatalog.module.css';

const tableBody = {
  ...Theme.textTableBody,
  padding: '8px 5px 8px 5px'
};

const canApplyForDataset = (dataset) => {
  return !isNil(dataset.dacId) && dataset.dacApproval;
};

const extractDatasetProp = (propertyName, dataset) => {
  const property = find({ propertyName })(dataset.properties);
  return property?.propertyValue;
};

const isVisible = (dataset) => {
  const openAccess = extractDatasetProp('Open Access', dataset);
  const publicDataset = extractDatasetProp('Public Visibility', dataset);
  const publicStudy = !isNil(dataset.study?.publicVisibility) ? dataset.study?.publicVisibility : true;

  const open = !isNil(openAccess) ? openAccess : false;
  const dacApproved = (!isNil(dataset.dacApproval) && dataset.dacApproval);
  const publiclyVisible = !isNil(publicDataset) ? publicDataset : publicStudy;

  return open || (dacApproved && publiclyVisible);
};

export default function DatasetCatalog(props) {

  const {
    customDacDatasetPage
  } = props;

  const isCustomDacDatasetPage = !isNil(customDacDatasetPage);
  const color = isCustomDacDatasetPage ? customDacDatasetPage.colorKey : 'dataset';
  const dacFilter = customDacDatasetPage?.dacFilter;

  // Data states
  const [currentUser, setCurrentUser] = useState({});
  const [datasetList, setDatasetList] = useState([]);
  const [sort, setSort] = useState({ field: 'datasetIdentifier', dir: 1 });
  const [numDatasetsSelected, setNumDatasetsSelected] = useState(0);
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [datasetsOnPage, setDatasetsOnPage] = useState([]);

  // Selection States
  const [currentPageAllDatasets, setCurrentPageAllDatasets] = useState(1);
  const [currentPageOnlySelected, setCurrentPageOnlySelected] = useState(1);

  const [useCustomFilter, setUseCustomFilter] = useState(isFunction(dacFilter));

  const [dataUse, setDataUse] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const [errorTitle, setErrorTitle] = useState();
  const [pageSize, setPageSize] = useState(10);
  const [searchDulText, setSearchDulText] = useState();
  const [selectedDatasetId, setSelectedDatasetId] = useState();

  // Modal States
  const [showDatasetDelete, setShowDatasetDelete] = useState(false);
  const [showDatasetEdit, setShowDatasetEdit] = useState(false);
  const [showTranslatedDULModal, setShowTranslatedDULModal] = useState(false);

  const [filterToOnlySelected, setFilterToOnlySelected] = useState(false);


  const applyDatasetSort = useCallback((sortParams, datasets) => {
    const sortedList = datasets.sort((a, b) => {
      const aVal = a[sortParams.field] || findPropertyValue(a, sortParams.field);
      const bVal = b[sortParams.field] || findPropertyValue(b, sortParams.field);
      return aVal.localeCompare(bVal, 'en', {numeric: true}) * sortParams.dir;
    });
    setSort(sortParams);
    setDatasetList(sortedList);
  }, []);

  const getDatasets = useCallback(async () => {
    let datasets = await DataSet.getDatasets();
    let localDacs = await getDacs();
    datasets = map((row, index) => {
      row.checked = false;
      row.ix = index;
      row.dbGapLink =
        getOr('')('propertyValue')(find({propertyName: 'url'})(row.properties));
      // Extracting these fields to make sorting easier
      row['Dataset ID'] = row.datasetIdentifier;
      row['Data Access Committee'] = findDacName(localDacs, row);
      row['Disease Studied'] = findPropertyValue(row, 'Phenotype/Indication');
      row['Principal Investigator (PI)'] = row.study?.piName || findPropertyValue(row, 'Principal Investigator(PI)');
      row['# of Participants'] = findPropertyValue(row, '# of participants');
      row['Data Custodian'] = findPropertyValue(row, 'Data Depositor');
      return row;
    })(datasets);
    applyDatasetSort(sort, datasets);
  }, [applyDatasetSort, sort]);

  useEffect(() => {
    const selected = datasetList.filter((ds) => ds.checked);

    setNumDatasetsSelected(selected.length);
    setSelectedDatasets(selected);
  }, [datasetList]);

  useEffect(() => {

    const numPages = Math.ceil(selectedDatasets.length / pageSize);
    // if we're past the last page, then
    // go to the last page.
    if (currentPageOnlySelected > numPages && numPages != 0) {
      setCurrentPageOnlySelected(numPages);
    }
  }, [selectedDatasets, pageSize, currentPageOnlySelected]);

  // Initialize page data
  useEffect( () => {
    const init = async() => {
      setCurrentUser(Storage.getCurrentUser());
      await getDatasets();
      ReactTooltip.rebuild();
    };
    init();
  }, [getDatasets]);

  useEffect( () => {
    const doEnrichment = async() => {
      spinnerService.showAll();
      const theCurrentPage = filterToOnlySelected ? currentPageOnlySelected : currentPageAllDatasets;
      const searchTable = (query) => (row) => {
        if (query) {
          let text = JSON.stringify(row);
          return text.toLowerCase().includes(query.toLowerCase());
        }
        return true;
      };
      const visibleDatasets = filterToOnlySelected ? selectedDatasets : datasetList;
      const results = (
        visibleDatasets
          .filter(searchTable(searchDulText))
          .filter((row) => {
            return (useCustomFilter ? dacFilter(row) : true);
          })
          .slice((theCurrentPage - 1) * pageSize, theCurrentPage * pageSize));
      await Promise.all(results.map(async (dataset) => {

        if (isNil(dataset.codeList)) {
          if (!dataset.dataUse || isEmpty(dataset.dataUse)) {
            dataset.codeList = 'None';
          } else {
            const translations = await DataUseTranslation.translateDataUseRestrictions(dataset.dataUse);
            const codes = [];
            translations.map((restriction) => {
              codes.push(restriction.alternateLabel || restriction.code);
            });
            dataset.codeList = codes.join(', ');
          }
        }
      }));
      setDatasetsOnPage(results);
      spinnerService.hideAll();
    };
    doEnrichment();

  }, [searchDulText, pageSize, selectedDatasets, datasetList, filterToOnlySelected, currentPageOnlySelected, currentPageAllDatasets, dacFilter, useCustomFilter]);

  const getDacs = async () => {
    let dacs = await DAC.list(false);
    dacs = dacs.map(dac => {
      return {id: dac.dacId, name: dac.name};
    });
    return dacs;
  };

  const currentPage = () => {
    return (filterToOnlySelected ? currentPageOnlySelected : currentPageAllDatasets);
  };


  const exportToRequest = async () => {
    let datasets = [];
    let datasetIdList = [];
    selectedDatasets
      .forEach(dataset => {
        datasets.push({
          key: dataset.dataSetId,
          value: dataset.dataSetId,
          label: dataset.name,
          concatenation: dataset.name,
        });
        datasetIdList.push(dataset.dataSetId);
      });
    const darBody = {
      userId: Storage.getCurrentUser().userId,
      datasets: datasets,
      datasetId: datasetIdList
    };
    const formData = await DAR.postDarDraft(darBody);
    const referenceId = formData.referenceId;
    props.history.push({ pathname: '/dar_application/' + referenceId });
  };

  const openTranslatedDUL = async (dataUse) => {
    const translations = await DataUseTranslation.translateDataUseRestrictions(dataUse);
    setDataUse(translations);
    setShowTranslatedDULModal(true);
  };

  const openDelete = (datasetId) => () => {
    setShowDatasetDelete(true);
    setSelectedDatasetId(datasetId);
  };

  const openEdit = (datasetId) => () => {
    setShowDatasetEdit(true);
    setSelectedDatasetId(datasetId);
  };

  const dialogHandlerDelete = async (e) => {
    const answer = getBooleanFromEventHtmlDataValue(e);
    if (answer) {
      DataSet.deleteDataset(selectedDatasetId).then(() => {
        getDatasets();
        setShowDatasetDelete(false);
      }).catch(() => {
        setShowDatasetDelete(true);
        setErrorMessage('Please try again later.');
        setErrorTitle('Something went wrong');
      });
    } else {
      setShowDatasetDelete(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
    }
  };

  const dialogHandlerEdit = async (e) => {
    const answer = getBooleanFromEventHtmlDataValue(e);
    if (answer) {
      setShowDatasetEdit(false);
      props.history.push({ pathname: `dataset_registration/${selectedDatasetId}` });
    } else {
      setShowDatasetEdit(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
    }
  };

  const download = () => {
    const listDownload = selectedDatasets;
    let dataSetsId = [];
    listDownload.forEach(dataset => {
      dataSetsId.push(dataset.dataSetId);
    });
    DataSet.downloadDataSets(dataSetsId, 'datasets.tsv');
  };

  const handlePageChange = (page) => {
    if (filterToOnlySelected) {
      setCurrentPageOnlySelected(page);
    } else {
      setCurrentPageAllDatasets(page);
    }
  };

  const handleSizeChange = (size) => {
    setPageSize(size);
    handlePageChange(1);
  };

  const handleSearchDul = (query) => {
    setSearchDulText(query);
  };

  const searchTable = (query) => (row) => {
    if (query) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };


  const allOnPageSelected = () => {

    const filteredList = datasetsOnPage.filter(canApplyForDataset);

    return filteredList.length > 0 && filteredList.every((row) => {
      return row.checked;
    });
  };

  const selectAllOnPage = (e) => {
    const checked = isNil(e.target.checked) ? false : e.target.checked;

    const datasetIdsToCheck = datasetsOnPage.map((row) => {
      return row.dataSetId;
    });

    const modifiedDatasetList = map((row) => {
      if (canApplyForDataset(row)) {
        if (datasetIdsToCheck.includes(row.dataSetId)) {
          row.checked = checked;
        }
      }

      return row;
    })(datasetList);

    // Update state
    setDatasetList(modifiedDatasetList);
  };

  const checkSingleRow = (dataset) => (e) => {
    const checked = isNil(e.target.checked) ? false : e.target.checked;
    const selectedDatasets = map(row => {
      if (row.dataSetId === dataset.dataSetId) {
        if (canApplyForDataset(row)) {
          row.checked = checked;
        }
      }
      return row;
    })(datasetList);

    // Update state
    setDatasetList(selectedDatasets);
  };

  const unapprovedStyle = (dataset) => {
    if (!isVisible(dataset)) {
      return {cursor: 'default', opacity: '50%'};
    }
    return {};
  };

  const findPropertyValue = (dataSet, propName, defaultVal) => {
    const defaultValue = isNil(defaultVal) ? '' : defaultVal;
    return getOr(defaultValue)('propertyValue')(find({ propertyName: propName })(dataSet.properties));
  };

  const findDacName = (dacs, dataSet) => {
    return getOr('')('name')(find({ id: dataSet.dacId })(dacs));
  };

  const getLinkDisplay = (dataSet, trIndex) => {
    try {
      const url = new URL(dataSet.dbGapLink);
      return (
        <a
          id={`${trIndex}_linkdbGap`}
          name="link_dbGap"
          href={url}
          target="_blank"
          className="enabled"
          rel='noreferrer'
        >
          Link
        </a>
      );
    } catch (e) {
      return <span>--</span>;
    }
  };

  const getSortDisplay = ({ field, label }) => {
    return (
      <div
        className="cell-sort"
        style={{ transform: 'translateY(1rem)' }}
        onClick={() => {
          let newSort =
            sort.field === field
              ? { field, dir: sort.dir * -1 }
              : { field, dir: 1 };
          applyDatasetSort(newSort, datasetList);
        }}
      >
        {label ? label : field}
        <div className="sort-container">
          <ArrowDropUp
            className={`sort-icon sort-icon-up ${sort.field === field && sort.dir === -1 ? 'active' : ''
            }`}
          />
          <ArrowDropDown
            className={`sort-icon sort-icon-down ${sort.field === field && sort.dir === 1 ? 'active' : ''
            }`}
          />
        </div>
      </div>
    );
  };

  const isEditDatasetEnabled = (dataset) => {
    // Study editing is not currently supported through existing edit page.
    if (!isNull(getOr(null)('study.studyId')(dataset))) {
      return false;
    }
    if (currentUser.isAdmin) {
      return true;
    }
    // Chairpersons can only edit datasets they have direct access to via their DACs
    if (currentUser.isChairPerson) {
      return flow(
        filter({name: USER_ROLES.chairperson}),
        map('dacId'),
        includes(dataset.dacId)
      )(currentUser.roles);
    }
    return false;
  };

  const visibleDatasets = () => {
    return (filterToOnlySelected ? selectedDatasets : datasetList);
  };

  return (
    <Fragment>
      <div className="container container-wide">
        <div className="row no-margin">
          <div className="no-padding" style={{ display: 'flex', alignItems: 'center' }}>
            <PageHeading
              id="datasetCatalog"
              imgSrc={isCustomDacDatasetPage ? undefined : DuosLogo}
              iconSize={isCustomDacDatasetPage ? 'none' : 'large'}
              color={color}
              title={!isCustomDacDatasetPage ? 'All DUOS Catalog' : `${customDacDatasetPage.dacName} Dataset Catalog`}
              description="Search and select datasets registered in DUOS. Click 'Apply for Access' to request access"
            />
            {isCustomDacDatasetPage && (
              <div style={{ width: '100%' }}>
                <img
                  src={customDacDatasetPage?.icon}
                  style={{ float: 'right' }}
                />
              </div>
            )}
          </div>
          <div>
            <div className="col-lg-7 col-md-7 col-sm-7 col-xs-7 search-wrapper" style={{ display: 'flex' }}>
              <SearchBox id="datasetCatalog" searchHandler={handleSearchDul} pageHandler={handlePageChange} color="dataset" />
              {isCustomDacDatasetPage && (
                <div className={style['checkbox']} style={{ marginLeft: '10px', width: '50%' }}>
                  <input
                    checked={useCustomFilter}
                    type="checkbox"
                    //select-all="true"
                    className={style['checkbox-inline']}
                    id="chk_filterDacId"
                    onChange={() => {
                      setUseCustomFilter(!useCustomFilter);
                      setCurrentPageOnlySelected(1);
                      setCurrentPageAllDatasets(1);
                    }}
                  />
                  <label className={style['regular-checkbox']} htmlFor="chk_filterDacId">
                    {`Filter to only ${customDacDatasetPage?.dacName} data`}
                  </label>
                </div>
              )}
            </div>
            {
              (currentUser.isAdmin || currentUser.isChairPerson) && (
                <button
                  id="btn_addDataset"
                  disabled={!currentUser.isAdmin && !currentUser.isChairPerson}
                  onClick={() => props.history.push('data_submission_form')}
                  className={`f-right btn-primary ${color}-background search-wrapper`}
                  data-tip="Add a new Dataset"
                  data-for="tip_addDataset"
                >
                  Add Dataset
                  <span className="glyphicon glyphicon-plus-sign" style={{ marginLeft: '5px' }} aria-hidden="true" />
                </button>
              )
            }
          </div>
        </div>
        <div style={Theme.lightTable}>
          <form className="pos-relative">
            <div className={`${style['checkbox']} ${style['display-inline-block']}`} style={{ marginLeft: '28px', marginBottom: '0px' }}>
              <input
                checked={allOnPageSelected()}
                type="checkbox"
                //select-all="true"
                className="checkbox-inline"
                id="chk_selectAll"
                onChange={selectAllOnPage}
              />
              <label className="regular-checkbox" htmlFor="chk_selectAll">
                Select All Visible
              </label>
            </div>
            <div className={style['display-inline-block']} style={{ top: '4px', position: 'absolute' }}>
              <div style={{ borderLeft: '1px solid rgb(204, 204, 204)', height: '15px' }} />
            </div>
            <div className={`${style['checkbox']} ${style['display-inline-block']}`} style={{ marginLeft: '18px', marginBottom: '0px' }}>
              <input
                type="checkbox"
                id="chk_onlySelected"
                checked={filterToOnlySelected}
                onChange={() => {
                  setFilterToOnlySelected(!filterToOnlySelected);
                }}
              />
              <label id="lbl_onlySelected" className={style['regular-checkbox']} htmlFor="chk_onlySelected">
                {`Show ${numDatasetsSelected} Dataset${numDatasetsSelected !== 1 ? 's' : ''} Selected`}
              </label>
            </div>
          </form>
          <div className={currentUser.isAdmin ? style['table-scroll-admin'] : style['table-scroll']}>
            <table className="table">
              <thead>
                <tr>
                  <th />
                  {currentUser.isAdmin || currentUser.isChairPerson && (
                    <th className={style['cell-size']} style={{ minWidth: '14rem' }}>Actions</th>
                  )}
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'datasetIdentifier', label: 'Dataset ID' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Dataset Name' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Data Access Committee' })}</th>
                  <th className={style['cell-size']}>Data Source</th>
                  <th className={style['cell-size']}>Data Use Terms</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Data Type' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Disease Studied' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Principal Investigator (PI)' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: '# of Participants' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Description' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Species' })}</th>
                  <th className={style['cell-size']}>{getSortDisplay({ field: 'Data Custodian' })}</th>
                </tr>
              </thead>
              <tbody>
                {!isNil(visibleDatasets()) && !isEmpty(visibleDatasets()) && datasetsOnPage.map((dataset, trIndex) => (
                  <Fragment key={trIndex}>
                    <tr>
                      <td className={style['first-child']} width="60px">
                        <div className={style['checkbox']}>
                          {!isNil(dataset.dacId) && (
                            <>
                              <input
                                type="checkbox"
                                id={`${trIndex}_chkSelect`}
                                name="chk_select"
                                checked={dataset.checked}
                                onChange={checkSingleRow(dataset)}
                              />
                              <label
                                className={style['regular-checkbox']}
                                style={unapprovedStyle(dataset)}
                                htmlFor={`${trIndex}_chkSelect`}
                              />
                            </>
                          )}
                        </div>
                      </td>
                      {(currentUser.isAdmin || currentUser.isChairPerson) && (
                        <td>
                          <div className={style['dataset-actions']}>
                            <a
                              id={`${trIndex}_btnDelete`}
                              name="btn_delete"
                              onClick={openDelete(dataset.dataSetId)}
                              disabled={!dataset.deletable || !isEditDatasetEnabled(dataset)}
                            >
                              <span
                                className={`cm-icon-button glyphicon glyphicon-trash caret-margin ${dataset.deletable ? 'default-color' : ''}`}
                                aria-hidden="true"
                                data-tip="Delete dataset"
                                data-for="tip_delete"
                              />
                            </a>
                            <a
                              id={`${trIndex}_btnEdit`}
                              name="btn_edit"
                              onClick={openEdit(dataset.dataSetId)}
                              disabled={!isEditDatasetEnabled(dataset)}
                            >
                              <span
                                className={`cm-icon-button glyphicon glyphicon-pencil caret-margin ${color}-color`}
                                aria-hidden="true"
                                data-tip="Edit dataset"
                                data-for="tip_edit"
                              />
                            </a>
                          </div>
                        </td>
                      )}
                      <td
                        id={`${dataset.datasetIdentifier}_dataset`}
                        name="datasetIdentifier"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {dataset['Dataset ID']}
                      </td>
                      <td
                        id={`${trIndex}_datasetName`}
                        name="datasetName"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        <a href={`/dataset/${dataset.datasetIdentifier}`}>{dataset.name}</a>
                      </td>
                      <td
                        id={`${trIndex}_dac`}
                        name="dac"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {dataset['Data Access Committee']}
                      </td>
                      <td className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`} style={tableBody}>
                        {getLinkDisplay(dataset, trIndex)}
                      </td>
                      <td className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`} style={tableBody}>
                        <a
                          id={`${trIndex}_linkTranslatedDul`}
                          name="link_translatedDul"
                          onClick={() => openTranslatedDUL(dataset.dataUse)}
                          className={!isVisible(dataset) ? style['dataset-disabled'] : 'enabled'}
                        >
                          {dataset.codeList}
                        </a>
                      </td>
                      <td
                        id={`${trIndex}_dataType`}
                        name="dataType"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {findPropertyValue(dataset, 'Data Type')}
                      </td>
                      <td
                        id={`${trIndex}_phenotype`}
                        name="phenotype"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {dataset['Disease Studied']}
                      </td>
                      <td
                        id={`${trIndex}_pi`}
                        name="pi"
                        className={`cell-size ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {dataset['Principal Investigator (PI)']}
                      </td>
                      <td
                        id={`${trIndex}_participants`}
                        name="participants"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {dataset['# of Participants']}
                      </td>
                      <td
                        id={`${trIndex}_description`}
                        name="description"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {findPropertyValue(dataset, 'Description')}
                      </td>
                      <td
                        id={`${trIndex}_species`}
                        name="species"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {findPropertyValue(dataset, 'Species')}
                      </td>
                      <td
                        id={`${trIndex}_depositor`}
                        name="depositor"
                        className={`${style['cell-size']} ${!isVisible(dataset) ? style['dataset-disabled'] : ''}`}
                        style={tableBody}
                      >
                        {dataset['Data Custodian']}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ margin: '0 20px 15px 20px' }}>
            <PaginatorBar
              total={visibleDatasets().filter(searchTable(searchDulText)).length}
              limit={pageSize}
              currentPage={currentPage()}
              onPageChange={handlePageChange}
              changeHandler={handleSizeChange}
            />
          </div>
        </div>
        <div className="col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding">
          { (currentUser.isAdmin || currentUser.isChairPerson || currentUser.isMember || currentUser.isSigningOfficial) && (
            <button
              id="btn_downloadSelection"
              disabled={selectedDatasets.length === 0}
              onClick={download}
              className={`col-lg-5 col-md-5 col-sm-5 col-xs-5 btn-primary ${color}-background`}
            >
               Download Dataset List
              <span className="glyphicon glyphicon-download" style={{ marginLeft: '5px' }} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="f-right">
          {currentUser.isResearcher && (
            <div className="f-right">
              <button
                id="btn_applyAccess"
                disabled={selectedDatasets.length === 0}
                onClick={() => exportToRequest()}
                className={`btn-primary ${color}-background search-wrapper`}
                data-tip="Request Access for selected Datasets"
                data-for="tip_requestAccess"
                style={{ marginBottom: '30%' }}
              >
               Apply for Access
              </button>
            </div>
          )}
        </div>
        {showTranslatedDULModal && (
          <TranslatedDulModal
            isRendered={showTranslatedDULModal}
            showModal={showTranslatedDULModal}
            dataUse={dataUse}
            onCloseRequest={() => setShowTranslatedDULModal(false)}
          />
        )}
        <ConfirmationDialog
          title="Delete Dataset Confirmation?"
          color="cancel"
          showModal={showDatasetDelete}
          alertMessage={errorMessage}
          alertTitle={errorTitle}
          action={{ label: 'Yes', handler: () => dialogHandlerDelete }}
        >
          <div className="dialog-description">Are you sure you want to delete this Dataset?</div>
        </ConfirmationDialog>
        <ConfirmationDialog
          title="Edit Dataset Confirmation?"
          color="dataset"
          alertMessage={errorMessage}
          alertTitle={errorTitle}
          showModal={showDatasetEdit}
          action={{ label: 'Yes', handler: () => dialogHandlerEdit }}
        >
          <div className="dialog-description">Are you sure you want to edit this Dataset?</div>
        </ConfirmationDialog>
        <ReactTooltip id="tip_delete" place="right" effect="solid" multiline className="tooltip-wrapper" />
        <ReactTooltip id="tip_requestAccess" effect="solid" multiline className="tooltip-wrapper" />
      </div>
    </Fragment>
  );
}
