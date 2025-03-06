import React from 'react';
import {useCallback, useState, useEffect} from 'react';
import {DatasetMetrics} from '../libs/ajax/DatasetMetrics';
import {DataSet} from '../libs/ajax/DataSet';
import {DAR} from '../libs/ajax/DAR';
import {Notifications} from '../libs/utils';
import {Styles, Theme} from '../libs/theme';
import {find} from 'lodash/fp';
import {ReadMore} from '../components/ReadMore';
import {formatDate} from '../libs/utils';
import {Button} from '@mui/material';
import {History} from 'history';
import {DataAccessRequest, Dataset, DatasetProperty, StudyProperty} from '../types/model';

const LINE = <div style={{borderTop: '1px solid #BABEC1', height: 0}}/>;

enum AccessManagement {
  OPEN = 'open',
  CONTROLLED = 'controlled',
  EXTERNAL = 'external'
}


interface DatasetStatisticsProps {
  history: History,
  match: {
    params: {
      datasetIdentifier: string;
    }
  }
}

export default function DatasetStatistics(props: DatasetStatisticsProps) {
  const {history, match: {params: {datasetIdentifier}}} = props;
  const [datasetId, setDatasetId] = useState<number>();
  const [dataset, setDataset] = useState<Dataset>();
  const [dars, setDars] = useState<Array<DataAccessRequest>>();
  const [isLoading, setIsLoading] = useState(true);

  const showError = (message: string) => {
    Notifications.showError({
      severity: 'error',
      text: `Error: ${message}`,
      timeout: 3500,
      layout: {
        vertical: 'bottom',
        horizontal: 'right'
      }
    });
  };

  const applyForAccess = async () => {
    try {
      const draftResponse = await DAR.postDarDraft({datasetId: [datasetId]});
      if (draftResponse.referenceId) {
        history.push(`/dar_application/${draftResponse.referenceId}`);
      } else if (draftResponse.message) {
        showError(draftResponse.message + ' Please contact customer support for help.');
      } else {
        showError('Unable to create a Draft Data Access Request');
      }
    } catch (_error) {
      showError('Unable to create a Draft Data Access Request');
    }
  };

  useEffect(() => {
    DataSet.getDatasetByDatasetIdentifier(datasetIdentifier).then((dataset) => {
      setData(dataset.datasetId);
    }).catch(() => {
      showError('Error: Unable to retrieve dataset from server');
    });
  }, [datasetIdentifier]);

  const extract = useCallback((propertyName: string) => {
    const property = find({propertyName})(dataset?.properties) as DatasetProperty;
    return property?.propertyValue;
  }, [dataset]);

  const extractStudyProp = useCallback((key: string) => {
    const property = find({key})(dataset?.study?.properties) as StudyProperty;
    if (Array.isArray(property?.value)) {
      return property.value.join(', ');
    }
    return property?.value;
  }, [dataset]);

  const setData = async (datasetId: number) => {
    try {
      setIsLoading(true);
      const metrics = await DatasetMetrics.getDatasetStats(datasetId);
      const dataset = await DataSet.getDataSetsByDatasetId(datasetId);
      setDatasetId(datasetId);
      setDataset(dataset);
      setDars(metrics.dars);
      setIsLoading(false);
    } catch (_error) {
      showError('Error: Unable to retrieve dataset statistics from server')
      setIsLoading(false);
    }
  };

  const accessInstructions = () => {
    const accessManagement = extract('Access Management')?.toLowerCase();
    const locationUrl = extract('URL');
    switch (accessManagement) {
      case AccessManagement.CONTROLLED:
        return <Button variant='contained' onClick={applyForAccess} sx={{transform: 'scale(1.5)'}}>
          Apply for Access
        </Button>;
      case AccessManagement.OPEN:
        return <span>This dataset is open access, does not require an access request
          {locationUrl &&
            <span>, and can be accessed directly through this <a href={locationUrl}>link</a>.</span>
          }
        </span>;
      case AccessManagement.EXTERNAL:
        return <span>This dataset is externally managed. Requests cannot be made via DUOS
          {locationUrl &&
            <span>, but must be made directly through the <a
              href={locationUrl}>dataset&apos;s host repository</a>.</span>
          }
        </span>;
      default:
        return <div/>;
    }
  };

  if (!isLoading) {
    return (
      <div style={{...Styles.PAGE, color: Theme.palette.primary}}>
        <div style={{justifyContent: 'space-between'}}>
          <div style={{marginTop: '25px'}}>
            <div style={Styles.TITLE}>Dataset Statistics</div>
            <div style={Styles.MEDIUM_ROW}>
              <div style={{fontWeight: '500', marginRight: '5px'}}>Dataset ID:</div>
              <div>{dataset?.datasetIdentifier}</div>
            </div>
            <div style={Styles.MEDIUM_ROW}>
              <div style={{fontWeight: '500', marginRight: '5px'}}>Dataset Name:</div>
              <div>
                {extract('Dataset Name') || dataset?.name}
              </div>
            </div>
            <div style={{paddingTop: '20px', paddingLeft: '30px'}}>
              {accessInstructions()}
            </div>
          </div>
          <div style={Styles.SUB_HEADER}>Dataset Information</div>
          <div style={{display: 'flex'}}>
            <div style={Styles.DESCRIPTION_BOX as React.CSSProperties}>
              <div style={{...Styles.MINOR_HEADER, paddingLeft: '10px'}}>Dataset Description:</div>
              {LINE}
              <div style={{fontSize: Theme.font.size.small, padding: '1rem'}}>
                {extract('Dataset Description') || dataset?.study?.description || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{display: 'flex'}}>
                <div style={Styles.SMALL_BOLD}>Number of Participants:</div>
                <div style={Styles.SMALL_BOLD}>
                  {extract('# of participants')}
                </div>
              </div>
              {(extract('Principal Investigator(PI)') || dataset?.study?.piName) && <div style={{display: 'flex'}}>
                <div style={Styles.SMALL_BOLD}>Principal Investigator:</div>
                <div style={Styles.SMALL_BOLD}>
                  {extract('Principal Investigator(PI)') || dataset?.study?.piName}
                </div>
              </div>}
              {(extractStudyProp('dataCustodianEmail') || dataset?.createUser?.displayName) && <div style={{display: 'flex'}}>
                <div style={Styles.SMALL_BOLD}>Data Custodian:</div>
                <div style={Styles.SMALL_BOLD}>
                  {extractStudyProp('dataCustodianEmail') || dataset?.createUser?.displayName}
                </div>
              </div>}
            </div>
          </div>
          <div style={Styles.SUB_HEADER}>Data Access Requests - Research Statements</div>
          {dars?.map((dar: DataAccessRequest) => (
            <div style={Styles.READ_MORE as React.CSSProperties} id={`${dar.darCode}`} key={`${dar.darCode}`}>
              <ReadMore
                // @ts-expect-error next-line props for non ts component
                props={props}
                readLessText='Show less'
                readMoreText='Show More'
                readStyle={{fontWeight: 500, margin: '20px', height: 0}}
                content={[
                  <div key='dar' style={{display: 'flex'}}>
                    <div style={{...Styles.MEDIUM, width: '12%', margin: '15px'}}>{dar.darCode}</div>
                    <div style={{...Styles.MEDIUM, margin: '15px'}}>{dar.projectTitle}</div>
                  </div>,
                  LINE
                ]}
                moreContent={[
                  <div key='updated' style={{display: 'flex', backgroundColor: 'white'}}>
                    <div style={{display: 'flex', paddingRight: '2rem'}}>
                      <div style={Styles.SMALL_BOLD}>Last Updated:</div>
                      <div style={Styles.SMALL_BOLD}>{formatDate(dar.updateDate)}</div>
                    </div>
                  </div>,
                  <div key='summary' style={{backgroundColor: 'white'}}>
                    <div style={Styles.SMALL_BOLD}>NonTechnical Summary:</div>
                    <div style={{fontSize: Theme.font.size.small, padding: '0 1rem 1rem 1rem'}}>
                      {dar.nonTechRus}
                    </div>
                  </div>,
                  LINE
                ]
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    return null;
  }
}
