import { useState, useEffect, Fragment } from 'react';
import { a, div, h2, h3, h } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import SimpleTable from '../../components/SimpleTable';
import './dar_application_new.css';
import { binCollectionToBuckets } from '../../utils/BucketUtils';
import { useCallback } from 'react';
import { isEmpty, flatten } from 'lodash/fp';

export const commonStyles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderWidth: '1px 0 1px 0',
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    border: 'none',
    margin: 0,
  }),
  containerOverride: {
    width: '100%',
    border: '1px solid black',
    borderWidth: '1px 1px 0 1px',
  }
};

const headerStyles = {
  ...commonStyles,
  cellWidth: {
    dataUseCodes: '20%',
    dataUseSummary: '80%'
  },
};

const columnStyles = {
  ...commonStyles,
  cellWidth: {
    datasetId: '20%',
    datasetName: '30%',
    whichDac: '20%',
    acknowledgment: '30%'
  },
};

const columnConfig = {
  datasetId: {
    label: 'Dataset ID',
    cellStyle: { width: columnStyles.cellWidth.datasetId },
    sortable: false
  },
  datasetName: {
    label: 'Dataset Name',
    cellStyle: { width: columnStyles.cellWidth.datasetName },
    sortable: false
  },
  whichDac: {
    label: 'DAC',
    cellStyle: { width: columnStyles.cellWidth.whichDac },
    sortable: false
  },
  acknowledgment: {
    label: 'Acknowledgment',
    cellStyle: { width: columnStyles.cellWidth.acknowledgment },
    sortable: false
  }
};

const columnHeaderData = (columns) => {
  return Object.values(columns);
};

export default function DucAddendum(props) {
  const { datasets, isLoading, save, doSubmit } = props;

  const [buckets, setBuckets] = useState([]);
  const [ducAddendumTable, setDucAddendumTable] = useState([]);

  const getBuckets = useCallback(async () => {
    if (isEmpty(datasets)) {
      setBuckets([]);
      return;
    }
    const buckets = await binCollectionToBuckets({ datasets });
    const dataAccessBuckets = buckets.filter(
      (bucket) => bucket.isRP !== true
    );
    setBuckets(dataAccessBuckets);
  }, [datasets]);

  useEffect(() => {
    getBuckets();
  }, [getBuckets]);

  const buildDucAddendumTable = useCallback(async () => {
    const tableChunks = buckets.map(bucket => {

      const dataUseCodes = bucket.label;
      const dataUseSummary = bucket.dataUses.map(dataUse => dataUse.description).join('. ');

      const headerConfig = {
        dataUseCodes: {
          label: dataUseCodes,
          cellStyle: { width: headerStyles.cellWidth.dataUseCodes, color: '#337ab7', fontSize: '1.6rem', margin: '1rem' },
          sortable: false
        },
        dataUseSummary: {
          label: dataUseSummary,
          cellStyle: { width: headerStyles.cellWidth.dataUseSummary, color: '#000000' },
          sortable: false
        },
      };

      const datasetData = bucket.datasets.map(dataset => {
        return [
          {
            data: dataset.datasetIdentifier,
            id: dataset.dataSetId,
            style: columnStyles
          },
          {
            data: dataset.datasetName,
            id: dataset.dataSetId,
            style: columnStyles
          },
          {
            data: 'Unknown',
            id: dataset.dataSetId,
            style: columnStyles
          },
          {
            data: 'Unknown',
            id: dataset.dataSetId,
            style: columnStyles
          }
        ];
      });

      return [
        h(Fragment, {}, [
          h(SimpleTable, {
            isLoading: isLoading,
            columnHeaders: columnHeaderData(headerConfig),
            rowData: [],
            styles: headerStyles
          }),
        ]),
        h(Fragment, {}, [
          h(SimpleTable, {
            isLoading: false,
            columnHeaders: columnHeaderData(columnConfig),
            rowData: datasetData,
            styles: columnStyles
          }),
        ]),
      ];
    });

    tableChunks.push(div({
      style: {
        borderTop: '1px solid black',
        borderWidth: '1px 0 0 0',
      },
    }, []));

    const fullTable = flatten(tableChunks);
    setDucAddendumTable(fullTable);
  }, [buckets, isLoading]);

  useEffect(() => {
    buildDucAddendumTable();
  }, [buildDucAddendumTable]);

  return (
    div({
      className: 'dar-step-card'
    }, [
      h2({}, ['Post Confirmation Summary']),
      h3({ style: { marginBottom: '2rem' } }, ['Review your DAR before submitting']),

      div({ className: 'table-container' }, ducAddendumTable),

      div({ className: 'flex flex-row', style: { justifyContent: 'flex-start', paddingTop: '4rem' }, }, [
        a({
          id: 'btn_submit', onClick: () => doSubmit(),
          className: 'button button-blue',
          style: {
            marginRight: '2rem',
          }
        }, ['Submit']),
        a({
          id: 'btn_save', onClick: () => save(),
          className: 'button button-white',
        }, ['Save']),
      ]),
    ])
  );
}
