import React, {useCallback, useEffect, useState} from 'react';
import {DatasetMetrics} from 'src/libs/ajax/DatasetMetrics';
import {DataSet} from 'src/libs/ajax/DataSet';
import {DAR} from 'src/libs/ajax/DAR';
import {formatDate, Notifications} from 'src/libs/utils';
import {Styles, Theme} from 'src/libs/theme';
import {find} from 'lodash/fp';
import {ReadMore} from '../components/ReadMore';
import {Button} from '@mui/material';
import {History} from 'history';
import {Dataset, DatasetProperty, DatasetStatisticsDar, DatasetStats, StudyProperty} from 'src/types/model';
import {extractError} from 'src/utils/ErrorUtils';
import {getDataLocationLink} from 'src/utils/DataLocationUtils';
import {consentTranslations} from 'src/libs/dataUseTranslation';

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


interface LabeledSectionProps {
  label: string
  style?: React.CSSProperties
}

const LabeledSection = ({ style, label, children }: React.PropsWithChildren<LabeledSectionProps>) =>
    <div style={{paddingTop: 20, ...style}}>
      <span style={{fontWeight: 600}}>{label}: </span>
      {children}
    </div>;

export default function DatasetStatistics(props: DatasetStatisticsProps) {
  const {history, match: {params: {datasetIdentifier}}} = props;
  const [dataset, setDataset] = useState<Dataset>();
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
      const draftResponse = await DAR.postDarDraft({datasetId: [dataset?.datasetId]});
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
        const dataset: Dataset = await DataSet.getDatasetByDatasetIdentifier(datasetIdentifier);
        const metrics: DatasetStats = await DatasetMetrics.getDatasetStats(dataset.datasetId);
        setDataset(dataset);
        setDars(metrics.dars);
        setIsLoading(false);
      } catch (error) {
        showError('Unable to retrieve dataset statistics from server: ' + extractError(error));
        setIsLoading(false);
      }
    }
    init();
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

  const accessInstructions = () => {
    const accessManagement = extract('Access Management')?.toLowerCase();
    const locationUrl = extract('URL');
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

  const accessType = extract('Access Management')?.toLowerCase();
  // const dataUseConsentTranslations = dataset?.dataUse ? consentTranslations[dataset.dataUse.] || undefined;

  console.log(dataset?.study)
  console.log(dataset?.dataUse)

  if (!isLoading) {
    return (
      <div style={{...Styles.PAGE, color: Theme.palette.primary}}>
        <div style={{justifyContent: 'space-between'}}>
          <div style={{marginTop: '25px'}}>
            <div style={{fontSize: 20, fontWeight: 600}}>
              <div>{dataset?.datasetIdentifier} - {extract('Dataset Name') || dataset?.name}</div>
            </div>
            {dataset?.study?.name && <LabeledSection label={'Study'}>
              <span>{dataset.study.name}</span>
            </LabeledSection>}
            <LabeledSection label={'Access Type'}>
              {accessInstructions() || 'N/A'}
            </LabeledSection>
            {(accessType === AccessManagement.CONTROLLED || accessType === AccessManagement.EXTERNAL) &&
                <LabeledSection label={'Data Use'}>
                  {dataset?.dataUse ? consentTranslations[dataset.dataUse] || dataset.dataUse : 'N/A'}
                </LabeledSection>
            }
            <LabeledSection label={'Data Location'}>
              {getDataLocationLink(extract('Data Location'), extract('URL'))}
            </LabeledSection>
            <LabeledSection label={'Phenotype'}>
              {extractStudyProp('phenotypeIndication')}
            </LabeledSection>
            <LabeledSection label={'Participants'}>
              {extract('# of participants')}
            </LabeledSection>
            {(extract('Principal Investigator(PI)') || dataset?.study?.piName) &&
                <LabeledSection label={'Principal Investigator(s)'}>
                  {extract('Principal Investigator(PI)') || dataset?.study?.piName}
                </LabeledSection>
            }
            {(extractStudyProp('dataCustodianEmail') || dataset?.createUser?.displayName) &&
                <LabeledSection label={'Data Custodian'}>
                  {extractStudyProp('dataCustodianEmail') || dataset?.createUser?.displayName}
                </LabeledSection>
            }
            <div style={{paddingTop: '20px'}}>
              {extract('Dataset Description') ?? dataset?.study?.description ?? 'N/A'}
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
