import {DatasetTerm} from 'src/types/model';
import _, {groupBy} from 'lodash';
import {Checkbox, Link} from '@mui/material';
import * as React from 'react';
import {OverflowTooltip} from '../Tooltips';
import {SnapshotSummaryModel} from 'src/types/tdrModel';
import DatasetExportButton from './DatasetExportButton';

export interface DatasetSearchTableTab<T> {
  key: string;
  label: string;
  makeHeaders: (datasets: DatasetTerm[], selected: number[], onSelect: (datasetIds: number[]) => void, exportableDatasets: { [duosId: string]: SnapshotSummaryModel[] }) => HeaderData<T>[];
  makeRows: (datasets: DatasetTerm[], headers: HeaderData<T>[]) => CellData[][];
}

interface DatasetSearchTableTabs {
  study: DatasetSearchTableTab<DatasetTerm[]>;
  dataset: DatasetSearchTableTab<DatasetTerm>;
}



const makeHeaderStyle = (width: string | number): React.CSSProperties => ({
  width,
});

const makeRowStyle = (width: string | number): React.CSSProperties => ({
  width,
  textOverflow: 'ellipsis',
  textWrap: 'nowrap',
  overflow: 'hidden',
  paddingRight: 5
});

const trimNewlineCharacters = (str: string): string => str?.replace( /[\r\n]+/gm, '');

interface CellData{
  data: string | React.ReactElement;
  value: string | React.ReactElement;
  id: string;
  style?: React.CSSProperties;
  label: string;
}

interface HeaderData<T>{
  label: string | React.ReactElement;
  sortable: boolean;
  cellStyle: React.CSSProperties;
  cellDataFn: (datasets: T) => CellData;
}

// eslint-disable-next-line no-unused-vars
export const makeStudyTableHeaders = (datasets: DatasetTerm[], selected: number[], onSelect: (datasetIds: number[]) => void, _exportableDatasets: { [duosId: string]: SnapshotSummaryModel[] }): HeaderData<DatasetTerm[]>[] => {
  interface StudyCellWidths{
    selected: number;
    studyName: string;
    description: string;
    participants: string;
    phenotype: string;
    species: string;
    piName: string;
    dataCustodians: string;
  }
  const studyCellWidths: StudyCellWidths = {
    selected: 50,
    // subtract the selected column width
    studyName: 'calc(25% - 50px)',
    description: '20%',
    participants: '10%',
    phenotype: '15%',
    species: '10%',
    piName: '10%',
    dataCustodians: '20%'
  };
  const datasetIds = datasets.map(dataset => dataset.datasetId);
  return [
    {
      label: <Checkbox checked={datasets.length === selected.length}
        indeterminate={selected.length > 0 && selected.length < datasetIds.length}
        onClick={() => onSelect(datasetIds.length === selected.length ? [] : datasetIds)}/>,
      sortable: false,
      cellStyle: makeHeaderStyle(studyCellWidths.selected),
      cellDataFn: datasets => {
        const studyDatasetIds = datasets.map(dataset => dataset.datasetId);
        const numberSelected = _.intersection(studyDatasetIds, selected).length;
        const fullySelected = numberSelected === studyDatasetIds.length;
        const indeterminate = numberSelected > 0 && numberSelected < studyDatasetIds.length;
        return {
          data: <Checkbox checked={fullySelected} indeterminate={indeterminate}
            onClick={() => onSelect(fullySelected ? _.without(selected, ...studyDatasetIds) : indeterminate ? _.xor(_.without(selected, ...studyDatasetIds), studyDatasetIds) : [...selected, ...studyDatasetIds])}/>,
          value: fullySelected ? 'Selected' : indeterminate ? 'Partially Selected' : 'Not Selected',
          id: `${datasets[0].study.studyId}-is-selected`,
          style: makeRowStyle(studyCellWidths.selected),
          label: `Study ${datasets[0].study.studyId} is ${fullySelected ? '' : indeterminate ? 'partially ' : 'not '} selected`
        };
      }
    },
    {
      label: 'Study Name',
      sortable: true,
      cellStyle: makeHeaderStyle(studyCellWidths.studyName),
      cellDataFn: (datasets) => ({
        data: <OverflowTooltip place={'top'} tooltipText={datasets[0].study.studyName} id={`${datasets[0].study.studyId}-study-name-data`}>
          {trimNewlineCharacters(datasets[0].study.studyName)}
        </OverflowTooltip>,
        value: datasets[0].study.studyName,
        id: `${datasets[0].study.studyId}-study-name`,
        style: makeRowStyle(studyCellWidths.selected),
        label: datasets[0].study.studyName
      })
    },
    {
      label: 'Description',
      sortable: true,
      cellStyle: makeHeaderStyle(studyCellWidths.description),
      cellDataFn: (datasets) => ({
        data: <OverflowTooltip place={'top'} tooltipText={datasets[0].study.description} id={`${datasets[0].study.studyId}-study-description-data`}>
          {trimNewlineCharacters(datasets[0].study.description)}
        </OverflowTooltip>,
        value: datasets[0].study.description,
        id: `${datasets[0].study.studyId}-study-description`,
        style: makeRowStyle(studyCellWidths.description),
        label: datasets[0].study.description
      })
    },
    {
      label: 'Participants',
      sortable: true,
      cellStyle: makeHeaderStyle(studyCellWidths.participants),
      cellDataFn: (datasets) => {
        const participantCount = datasets.map(dataset => dataset.participantCount).reduce((partialSum, participants) => partialSum + participants, 0);
        return {
          data: isNaN(participantCount) ? '' : participantCount.toString(),
          value: participantCount.toString(),
          id: `${datasets[0].study.studyId}-participant-count`,
          style: makeRowStyle(studyCellWidths.participants),
          label: `Participant Count for study ${datasets[0].study.studyId}: ${participantCount}`
        };
      }
    },
    {
      label: 'Phenotype',
      sortable: true,
      cellStyle: makeHeaderStyle(studyCellWidths.phenotype),
      cellDataFn: (datasets) => ({
        data: <OverflowTooltip place={'top'} tooltipText={datasets[0].study.phenotype} id={`${datasets[0].study.studyId}-study-phenotype-data`}>
          {trimNewlineCharacters(datasets[0].study.phenotype)}
        </OverflowTooltip>,
        value: datasets[0].study.phenotype,
        id: `${datasets[0].study.studyId}-phenotype`,
        style: makeRowStyle(studyCellWidths.phenotype),
        label: `Phenotype for study ${datasets[0].study.studyId}: ${datasets[0].study.phenotype}`
      })
    },
    {
      label: 'Species',
      sortable: true,
      cellStyle: makeHeaderStyle(studyCellWidths.species),
      cellDataFn: (datasets) => ({
        data: <OverflowTooltip place={'top'} tooltipText={datasets[0].study.species} id={`${datasets[0].study.studyId}-study-species-data`}>
          {trimNewlineCharacters(datasets[0].study.species)}
        </OverflowTooltip>,
        style: makeRowStyle(studyCellWidths.species),
        value: datasets[0].study.species,
        id: `${datasets[0].study.studyId}-species`,
        label: `Species for study ${datasets[0].study.studyId}: ${datasets[0].study.species}`
      })
    },
    {
      label: 'PI Name',
      sortable: true,
      cellStyle: makeHeaderStyle(studyCellWidths.piName),
      cellDataFn: (datasets) => ({
        data: <OverflowTooltip place={'top'} tooltipText={datasets[0].study.piName} id={`${datasets[0].study.piName}-study-pi-name-data`}>
          {trimNewlineCharacters(datasets[0].study.piName)}
        </OverflowTooltip>,
        value: datasets[0].study.piName,
        id: `${datasets[0].study.studyId}-pi-name`,
        style: makeRowStyle(studyCellWidths.piName),
        label: `PI for study ${datasets[0].study.studyId}: ${datasets[0].study.piName}`
      })
    },
    {
      label: 'Data Custodian',
      sortable: true,
      cellStyle: makeHeaderStyle(studyCellWidths.dataCustodians),
      cellDataFn: (datasets) => {
        const custodians = datasets[0].study.dataCustodianEmail.join(', ');
        return {
          data: <OverflowTooltip place={'top'} tooltipText={custodians} id={`${datasets[0].study.studyId}-study-custodian-data`}>
            {custodians}
          </OverflowTooltip>,
          value: custodians,
          id: `${datasets[0].study.studyId}-custodians`,
          style: makeRowStyle(studyCellWidths.dataCustodians),
          label: `Data Custodians for study ${datasets[0].study.studyId}: ${custodians}`
        };
      }
    },
  ];
};

export const makeStudyTableRowData = (datasets: DatasetTerm[], headers: HeaderData<DatasetTerm[]>[]) => {
  const studies = groupBy(datasets, 'study.studyId');
  return Object.values(studies).map((datasets: DatasetTerm[]) => headers.map(header => header.cellDataFn(datasets)));
};

export const makeDatasetTableHeader = (datasets: DatasetTerm[], selected: number[], onSelect: (datasetIds: number[]) => void, exportableDatasets: { [duosId: string]: SnapshotSummaryModel[] }): HeaderData<DatasetTerm>[] => {
  interface CellWidths{
    selected: number;
    datasetName: string;
    studyName: string;
    duosId: string;
    accessType: string;
    dataType: string;
    donorSize: string;
    dataLocation: string;
    dac: string;
    exportToTerra: number;
  }
  const cellWidths: CellWidths = {
    selected: 50,
    // subtract the selected column width
    datasetName: 'calc(25% - 150px)',
    studyName: '10%',
    duosId: '10%',
    accessType: '10%',
    dataType: '15%',
    donorSize: '7%',
    dataLocation: '13%',
    dac: '10%',
    exportToTerra: 100,
  };
  const datasetIds = datasets.map(dataset => dataset.datasetId);
  return [
    {
      label: <Checkbox checked={datasets.length === selected.length}
        indeterminate={selected.length > 0 && selected.length < datasets.length}
        onClick={() => onSelect(datasetIds.length === selected.length ? [] : datasetIds)}/>,
      sortable: false,
      cellStyle: makeHeaderStyle(cellWidths.selected),
      cellDataFn: (dataset: DatasetTerm) => {
        const isSelected = selected.includes(dataset.datasetId);
        return {
          data: <Checkbox checked={isSelected}
            onClick={() => onSelect(_.xor([dataset.datasetId], selected))}/>,
          value: isSelected ? 'Selected' : 'Not Selected',
          id: `${dataset.datasetId}-is-selected`,
          style: makeRowStyle(cellWidths.selected),
          label: `Dataset ${dataset.datasetId} is ${isSelected ? '' : 'not '} selected`
        };
      }
    },
    {
      label: 'Dataset Name',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.datasetName),
      cellDataFn: (dataset: DatasetTerm) => ({
        data: <OverflowTooltip place={'top'} tooltipText={dataset.datasetName} id={`${dataset.datasetId}-dataset-name`}>
          {trimNewlineCharacters(dataset.datasetName)}
        </OverflowTooltip>,
        value: dataset.datasetName,
        id: `${dataset.datasetId}-dataset-name`,
        style: makeRowStyle(cellWidths.datasetName),
        label: dataset.datasetName
      })
    },
    {
      label: 'Study Name',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.studyName),
      cellDataFn: (dataset: DatasetTerm) => ({
        data: <OverflowTooltip place={'top'} tooltipText={dataset.study.studyName} id={`${dataset.datasetId}-study-name`}>
          {trimNewlineCharacters(dataset.study.studyName)}
        </OverflowTooltip>,
        value: dataset.study.studyName,
        id: `${dataset.datasetId}-study-name`,
        style: makeRowStyle(cellWidths.studyName),
        label: dataset.study.studyName,
      })
    },
    {
      label: 'DUOS Id',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.duosId),
      cellDataFn: (dataset: DatasetTerm) => ({
        data: <Link key={dataset.datasetId}
          href={`/dataset/${dataset.datasetIdentifier}`}>{dataset.datasetIdentifier}</Link>,
        value: dataset.datasetIdentifier,
        id: `${dataset.datasetId}-study-description`,
        style: makeRowStyle(cellWidths.duosId),
        label: dataset.datasetIdentifier
      })
    },
    {
      label: 'Access Type',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.accessType),
      cellDataFn: (dataset: DatasetTerm) => {
        let accessType;
        if (dataset.accessManagement === 'external') {
          accessType = dataset.url ?
            <Link href={dataset.url}>External to DUOS</Link> : 'External to DUOS';
        } else if (dataset.accessManagement === 'open') {
          accessType = dataset.url ? <Link href={dataset.url}>Open Access</Link> : 'Open Access';
        } else {
          accessType = dataset.dac?.dacEmail ? <Link
            href={'mailto:' + dataset.dac.dacEmail}>{dataset.dac?.dacName}</Link> : dataset.dac?.dacName;
        }
        return {
          data: accessType,
          value: dataset.accessManagement,
          id: `${dataset.datasetId}-participant-count`,
          style: makeRowStyle(cellWidths.accessType),
          label: `Access Type for dataset ${dataset.datasetId}: ${dataset.accessManagement}`
        };
      }
    },
    {
      label: 'Data Type',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.dataType),
      cellDataFn: (dataset: DatasetTerm) => ({
        data: <OverflowTooltip place={'top'} tooltipText={dataset.study.dataTypes?.join(', ')} id={`${dataset.datasetId}-dataset-data-types`}>
          {dataset.study.dataTypes?.join(', ')}
        </OverflowTooltip>,
        value: dataset.study.dataTypes?.join(', '),
        id: `${dataset.datasetId}-data-types`,
        style: makeRowStyle(cellWidths.dataType),
        label: `Data Types for dataset ${dataset.datasetId}: ${dataset.study.dataTypes?.join(', ')}`
      })
    },
    {
      label: 'Donor Size',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.donorSize),
      cellDataFn: (dataset: DatasetTerm) => {
        const donorSize = isNaN(dataset.participantCount) ? '' : dataset.participantCount.toString();
        return {
          data: donorSize,
          style: makeRowStyle(cellWidths.donorSize),
          value: donorSize,
          id: `${dataset.datasetId}-participant-count`,
          label: `Participant Count for dataset ${dataset.datasetId}: ${donorSize}`
        };
      }
    },
    {
      label: 'Data Location',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.dataLocation),
      cellDataFn: (dataset: DatasetTerm) => {
        let dataLocation;
        if (dataset.dataLocation === 'TDR Location') {
          dataLocation = dataset.url ?
            <Link href={dataset.url}>Terra Data Repo</Link> : 'Terra Data Repo';
        } else if (dataset.dataLocation === 'Terra Workspace') {
          dataLocation = dataset.url ?
            <Link href={dataset.url}>Terra Workspace</Link> : 'Terra Data Repo';
        } else if (dataset.dataLocation === 'Not Determined') {
          dataLocation = 'Not Determined';
        } else {
          dataLocation = dataset.url ?
            <Link href={dataset.url}>External to DUOS</Link> : 'External Location';
        }
        return {
          data: dataLocation,
          value: dataset.accessManagement,
          id: `${dataset.datasetId}-participant-count`,
          style: makeRowStyle(cellWidths.accessType),
          label: `Access Type for dataset ${dataset.datasetId}: ${dataset.dataLocation}`
        };
      }
    },
    {
      label: 'DAC',
      sortable: true,
      cellStyle: makeHeaderStyle(cellWidths.dac),
      cellDataFn: (dataset: DatasetTerm) => ({
        data: <OverflowTooltip place={'top'} tooltipText={dataset.dac?.dacName} id={`${dataset.datasetId}-dataset-dac`}>
          {dataset.dac?.dacName}
        </OverflowTooltip>,
        value: dataset.dac?.dacName,
        id: `${dataset.datasetId}-dac`,
        style: makeRowStyle(cellWidths.dac),
        label: `DAC for dataset ${dataset.datasetId}: ${dataset.dac?.dacName}`
      })
    },
    {
      label: 'Export to Terra',
      sortable: false,
      cellStyle: makeHeaderStyle(cellWidths.exportToTerra),
      cellDataFn: (dataset: DatasetTerm) => {
        const exportableSnapshots = exportableDatasets[dataset.datasetIdentifier] || [];
        return {
          data: <>{exportableSnapshots
            .map((snapshot, i) =>
              <DatasetExportButton
                key={`${i}`}
                snapshot={snapshot}
                title={`Export snapshot ${snapshot.name}`}/>)}</>,
          value: 'Export to Workspace',
          id: `${dataset.datasetId}-export-to-terra`,
          style: makeRowStyle(cellWidths.exportToTerra),
          label: `Export to Terra for dataset ${dataset.datasetId}`
        };
      }
    }
  ];
};

export const makeDatasetTableRows = (datasets: DatasetTerm[], headers: HeaderData<DatasetTerm>[]): CellData[][] => datasets.map(dataset => headers.map(header => header.cellDataFn(dataset)));


export const datasetSearchTableTabs: DatasetSearchTableTabs = {
  study: {
    key: 'study-table-tab',
    label: 'View By Studies',
    makeHeaders: makeStudyTableHeaders,
    makeRows: makeStudyTableRowData,
  },
  dataset: {
    key: 'datasets-table-tab',
    label: 'View By Datasets',
    makeHeaders: makeDatasetTableHeader,
    makeRows: makeDatasetTableRows,
  }
};
