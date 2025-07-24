import React, {useEffect, useState} from 'react';
import {DatasetMetrics} from 'src/libs/ajax/DatasetMetrics';
import {DataSet} from 'src/libs/ajax/DataSet';
import {DAR} from 'src/libs/ajax/DAR';
import {formatDate, Notifications} from 'src/libs/utils';
import {Styles, Theme} from 'src/libs/theme';
import {ReadMore} from 'src/components/ReadMore';
import {Button} from '@mui/material';
import {
  DatasetStatisticsDar,
  DatasetStats,
  DatasetTerm
} from 'src/types/model';
import {extractError} from 'src/utils/ErrorUtils';
import {getDataLocationLink} from 'src/utils/DataLocationUtils';
import {createDataUseDisplay} from 'src/utils/DataUseUtils';
import {History} from 'history';

const LINE = <div style={{borderTop: '1px solid #BABEC1', height: 0}}/>;

enum AccessManagement {
  OPEN = 'open',
  CONTROLLED = 'controlled',
  EXTERNAL = 'external'
}


interface DatasetStatisticsProps {
  readonly history: History,
  readonly match: {
    params: {
      datasetIdentifier: string;
    }
  }
}

const LabeledField = ({label, children}: { label: string, children: React.ReactNode }) => {
  return (
      <div style={{paddingTop: 20}}>
        <span style={{fontWeight: 600}}>{label}: </span>
        {children}
      </div>
  );
}

export default function DatasetStatistics(props: DatasetStatisticsProps) {
  const {history, match: {params: {datasetIdentifier}}} = props;
  const [datasetTerm, setDatasetTerm] = useState<DatasetTerm>();
  const [dars, setDars] = useState<Array<DatasetStatisticsDar>>();
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
      const draftResponse = await DAR.postDarDraft({datasetId: [datasetTerm?.datasetId]});
      if (draftResponse.referenceId) {
        history.push(`/dar_application/${draftResponse.referenceId}`);
      } else if (draftResponse.message) {
        showError(draftResponse.message + ' Please contact customer support for help.');
      } else {
        showError('Unable to create a Draft Data Access Request');
      }
    } catch (error) {
      showError('Unable to create a Draft Data Access Request: ' + extractError(error));
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const datasetTerms: DatasetTerm[] = await DataSet.searchDatasetIndex({ query: {
          'bool': {
            'must': [
              {
                'match': {
                  '_type': 'dataset'
                }
              },
              {
                'match_phrase': {
                  'datasetIdentifier': datasetIdentifier
                }
              }
            ]
          }
        }})

        if(datasetTerms.length != 1) {
          showError(`Unable to retrieve dataset statistics from server: dataset ${datasetIdentifier} not found.`);
          setIsLoading(false);
          return;
        } else {
          setDatasetTerm(datasetTerms[0]);
          const metrics: DatasetStats = await DatasetMetrics.getDatasetStats(datasetTerms[0].datasetId);
          setDars(metrics.dars);
        }
        setIsLoading(false);
      } catch (error) {
        showError('Unable to retrieve dataset statistics from server: ' + extractError(error));
        setIsLoading(false);
      }
    }
    init();
  }, [datasetIdentifier]);

  const accessInstructions = () => {
    const accessManagement = datasetTerm?.accessManagement as AccessManagement;
    const locationUrl = datasetTerm?.url;
    switch (accessManagement) {
      case AccessManagement.CONTROLLED:
        return <Button variant='contained' onClick={applyForAccess} style={{fontSize: '12px'}}>
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
        return <span>N/A</span>;
    }
  };

  if (!isLoading && datasetTerm) {
    return (
      <div style={{...Styles.PAGE, color: Theme.palette.primary}}>
        <div style={{justifyContent: 'space-between'}}>
          <div style={{marginTop: '25px'}}>
            <div style={{fontSize: 20, fontWeight: 600}}>
              <div>{datasetTerm.datasetIdentifier} - {datasetTerm.datasetName}</div>
            </div>
            <LabeledField label={'Study'}>
              {datasetTerm.study.studyName}
            </LabeledField>
            <LabeledField label={'Access Type'}>
              {accessInstructions()}
            </LabeledField>
            {(datasetTerm.accessManagement === AccessManagement.CONTROLLED || datasetTerm.accessManagement === AccessManagement.EXTERNAL) &&
                <LabeledField label={'Data Use'}>
                  {createDataUseDisplay({dataset: datasetTerm, divStyle: {display: 'inline-block'}, tooltipPlace: 'right'})}
                </LabeledField>
            }
            <LabeledField label={'Data Location'}>
              {getDataLocationLink(datasetTerm.dataLocation, datasetTerm.url)}
            </LabeledField>
            <LabeledField label={'Phenotype'}>
                {datasetTerm.study?.phenotype ?? 'N/A'}
            </LabeledField>
            <LabeledField label={'Participants'}>
                {datasetTerm.participantCount}
            </LabeledField>
            <LabeledField label={'Principal Investigator'}>
                {datasetTerm.study.piName}
            </LabeledField>
            <LabeledField label={'Data Custodian'}>
              {datasetTerm.study.dataCustodianEmail?.join(', ') ?? 'N/A'}
            </LabeledField>
            <div style={{paddingTop: '20px'}}>
              {datasetTerm.study.description}
            </div>
          </div>
          <div style={{paddingTop: 20, marginTop: 20, borderTop: '1px solid black', width: '100%'}}/>
          <div style={Styles.SUB_HEADER}>Data Access Requests for this dataset</div>
          {dars?.length === 0 &&
            <div style={{paddingTop: '20px', fontStyle: 'italic'}}>
                No Data Access Requests have been created for this dataset.
            </div>
          }
          {dars?.map((dar: DatasetStatisticsDar) => (
            <div style={Styles.READ_MORE as React.CSSProperties} id={`${dar.darCode}`} key={`${dar.darCode}`}>
              <ReadMore
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
