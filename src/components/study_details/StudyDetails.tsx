import React, {useEffect, useState} from 'react';
import {DataSet} from '../../libs/ajax/DataSet';
import {DatasetTerm, StudyTerm} from '../../types/model';
// @ts-expect-error backArrowIcon is a static asset that isn't picked up by TypeScript
import backArrowIcon from '../../images/back_arrow.svg';
import {Link} from 'react-router-dom';
import {
  makeDatasetTableHeader,
  makeDatasetTableRows
} from '../data_search/DatasetSearchTableConstants';
import SimpleTable from '../SimpleTable';
import {Styles} from '../../libs/theme';
import {TerraDataRepo} from '../../libs/ajax/TerraDataRepo';
import {chain, intersection, isEmpty, Dictionary} from 'lodash';
import {EnumerateSnapshotModel, SnapshotSummaryModel} from '../../types/tdrModel';
import {DatasetSearchFooter} from '../data_search/DatasetSearchFooter';
import {applyForAccess} from '../../utils/accessUtils';
import {History} from 'history';

const styles = {
  row: {
    display: 'flex',
    alignItems: 'flex-start'
  },
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderRadius: '4px',
    textOverflow: 'ellipsis',
    height: '4rem',
    marginTop: 5,
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    backgroundColor: '#E2E8F4',
    border: 'none',
    textTransform: 'uppercase',
    lineHeight: '16px',
  }),
  containerOverride: {}
};

interface StudyDetailsProps {
  history: History,
  match: {
    params: {
      studyId: number;
    }
  }
}
export const StudyDetails = (props: StudyDetailsProps) => {
  const { history } = props;
  const { studyId } = props.match.params;
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<DatasetTerm[]>([]);
  const [exportableDatasets, setExportableDatasets] = useState<Dictionary<SnapshotSummaryModel[]>>({});
  const [selectedDatasets, setSelectedDatasets] = useState<number[]>([]);

  const study: StudyTerm | undefined = datasets.length > 0 ? datasets[0].study : undefined;
  const headers = makeDatasetTableHeader(datasets, selectedDatasets, setSelectedDatasets, exportableDatasets);
  const rowData = makeDatasetTableRows(datasets, headers);

  const getExportableDatasets = async (datasets: DatasetTerm[]) => {
    // Note the dataset identifier is in each sub-table row.
    const datasetIdentifiers = datasets.map((row) => row.datasetIdentifier);
    const snapshots = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers) as EnumerateSnapshotModel;
    if (snapshots.filteredTotal > 0) {
      const datasetIdToSnapshot = chain(snapshots.items)
        // Ignore any snapshots that a user does not have export (steward or reader) to
        .filter((snapshot: { id: string }) => intersection(snapshots.roleMap[snapshot.id] as string[], ['steward', 'reader']).length > 0)
        .groupBy('duosId')
        .value();
      setExportableDatasets(datasetIdToSnapshot);
    }
  };

  useEffect(() => {
    const query = {
      'from': 0,
      'size': 10000,
      'query': {
        'bool': {
          'must': [
            {
              'match': {
                '_type': 'dataset'
              }
            },
            {
              'match': {
                'study.studyId': studyId
              }
            },
            {
              'exists': {
                'field': 'study'
              }
            }
          ],
        }
      }
    };
    DataSet.searchDatasetIndex(query).then((datasets) => {
      setDatasets(datasets);
      setLoading(false);
    });
  }, [studyId, setDatasets]);

  useEffect(() => {
    getExportableDatasets(datasets);
  }, [datasets]);

  interface SectionProps {
    style?: React.CSSProperties
  }

  const Section = ({ style, children }: React.PropsWithChildren<SectionProps>) =>
    <div style={{paddingTop: 20, ...style}}>{children}</div>;

  const participantCount = datasets
    .map(dataset => dataset.participantCount)
    .reduce((partialSum, participants) => partialSum + participants, 0);

  return !loading ? <div style={styles.row}>
    <div style={{paddingLeft: 40}}>
      <Link
        id='link_datalibrary'
        to='/datalibrary'
        className='navbar-brand'
        style={{height: 28, width: 28}}
      >
        <img id='back-arrow-icon' src={backArrowIcon} alt={'Back'} style={{height: 28, width: 28}}/>
      </Link>
    </div>
    <div style={{padding: '0 16px', display: 'flex', flexDirection: 'column', width: '100%'}}>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        Back to library
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, paddingTop: 20 }}>
        {study?.studyName}
      </div>
      <Section>
        {study?.description}
      </Section>
      {!isNaN(participantCount) && <Section>
        <span style={{fontWeight: 600}}>Participants: </span>
        <span>{
          participantCount
        }</span>
      </Section>}
      {study?.phenotype && <Section>
        <span style={{fontWeight: 600}}>Phenotype: </span>
        <span>{study?.phenotype}</span>
      </Section>}
      {study?.species && <Section>
        <span style={{fontWeight: 600}}>Species: </span>
        <span>{study?.species}</span>
      </Section>}
      {study?.piName && <Section>
        <span style={{fontWeight: 600}}>PI Name: </span>
        <span>{study?.piName}</span>
      </Section>}
      {study?.dataCustodianEmail && study.dataCustodianEmail.length > 0 && <Section>
        <span style={{fontWeight: 600}}>Data Custodian: </span>
        <span>{study?.dataCustodianEmail.join(', ')}</span>
      </Section>}
      <div style={{paddingTop: 20, marginTop: 20, borderTop: '1px solid black', width: '100%'}}>
        <SimpleTable
          rowData={rowData}
          columnHeaders={headers}
          selected={selectedDatasets}
          styles={styles}
          tableSize={10}
          summary='faceted dataset search table'
        />
      </div>
    </div>
    {!isEmpty(selectedDatasets) && <DatasetSearchFooter selectedDatasets={selectedDatasets} datasets={datasets} onClick={() => applyForAccess(selectedDatasets, history)}/>}
  </div> : <div>Loading</div>;
};
