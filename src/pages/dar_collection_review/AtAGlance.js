import {div, h} from 'react-hyperscript-helpers';
import {isNil, isEmpty, find, chunk} from 'lodash/fp';
import {useState} from 'react';
import SimpleTable from '../../components/SimpleTable';
import {Styles} from '../../libs/theme';
import cellData from './AtAGlanceCellData'

export const styles = {
  title: {
    fontWeight: 800,
    fontSize: '2.7rem',
  },
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidth: {
    dataUse: '20%',
    dacFinalDecision: '20%',
    structuredResearchPurpose: '15%',
    dacResearchPurposeAgreement: '17.5%',
    duosAlgorithmDecision: '12.5%',
    dacVsDuosAlgorithm: '10%'
  },
  color: {
    dataUse: '#000000',
    dacFinalDecision: '#000000',
    structuredResearchPurpose: '#000000',
    dacResearchPurposeAgreement: '#000000',
    duosAlgorithmDecision: '#000000',
    dacVsDuosAlgorithm: '#000000'
  },
  fontSize: {
    dataUse: '1.6rem',
    dacFinalDecision: '1.6rem',
    structuredResearchPurpose: '1.6rem',
    dacResearchPurposeAgreement: '1.6rem',
    duosAlgorithmDecision: '1.6rem',
    dacVsDuosAlgorithm: '1.6rem'
  }
};

export default function AtAGlance(props) {
  const [collection, setCollection] = useState(props.collection);
  const [dataUseBuckets, setDataUseBuckets] = useState(props.dataUseBuckets);

  const columnHeaderFormat = {
    dataUse: {
      label: 'Data Use',
      cellStyle: {width: styles.cellWidth.dataUse}
    },
    dacFinalDecision: {
      label: 'DAC Final Decision',
      cellStyle: {width: styles.cellWidth.dacFinalDecision}
    },
    structuredResearchPurpose: {
      label: 'Structured Research Purpose',
      cellStyle: {width: styles.cellWidth.structuredResearchPurpose}
    },
    dacResearchPurposeAgreement: {
      label: 'DAC Research Purpose Agreement',
      cellStyle: {width: styles.cellWidth.dacResearchPurposeAgreement}
    },
    duosAlgorithmDecision: {
      label: 'DUOS Algorithm Decision',
      cellStyle: {width: styles.cellWidth.duosAlgorithmDecision}
    },
    dacVsDuosAlgorithm: {
      label: 'DAC vs DUOS Algorithm',
      cellStyle: {width: styles.cellWidth.dacVsDuosAlgorithm}
    },

    headerCell: {
      label: 'Header Cell',
      cellStyle: {width: styles.cellWidth.header},
    },
  };

  //todo: use collection and dataUseBuckets to get necessary data
  //todo: update logic in AtAGlanceCellData.js
  const columnHeaderData = () => {
    const {dataUse, dacFinalDecision, structuredResearchPurpose, dacResearchPurposeAgreement, duosAlgorithmDecision, dacVsDuosAlgorithm} = columnHeaderFormat;
    return [dataUse, dacFinalDecision, structuredResearchPurpose, dacResearchPurposeAgreement, duosAlgorithmDecision, dacVsDuosAlgorithm];
  };

  const processAtAGlanceData = ({collection, dataUseBuckets}) => {
    const rowElementMaxCount = 11;
    //chunking elements subdivides the entire bucket list to rows of max rowElementMaxCount size
    //Needed to provide predictable design, can't have a flexbox row of n elements with infinitesimal width
    const chunkedBuckets = chunk(rowElementMaxCount)(dataUseBuckets);
    //convert is once again used here to provide unique key identifier for the row
    //necessary for React when rendering elements provided by an array
    if(!isNil(dataUseBuckets)) {
      return dataUseBuckets.map((dataUseBucket) => {
        const {
          dataUse,
          dacFinalDecision,
          structuredResearchPurpose,
          dacResearchPurposeAgreement,
          duosAlgorithmDecision,
          dacVsDuosAlgorithm
        } = dataUseBucket;

        return [
          cellData.dataUseCellData({dataUse}),
          cellData.dacFinalDecisionCellData({dacFinalDecision}),
          cellData.structuredResearchPurposeCellData({structuredResearchPurpose}),
          cellData.dacResearchPurposeAgreementCellData({dacResearchPurposeAgreement}),
          cellData.duosAlgorithmDecisionCellData({duosAlgorithmDecision}),
          cellData.dacVsDuosAlgorithmCellData({dacVsDuosAlgorithm})
        ];
      });
    }
  };

  return (
    div({},
      [
        div({className: 'at-a-glance-subheader', style: styles.title},
          ['At A Glance']),
        h(SimpleTable, {
          isLoading: false,
          // todo: one row per data use bucket
          // rowData: processAtAGlanceData(collection, dataUseBuckets),
          rowData: [
            [
              {
                data: 'Cell Data',
                id: 1,
                style: styles,
                label: 'Cell Data',
              },
            ],
          ],
          columnHeaders: columnHeaderData(),
          styles: styles,
          tableSize: 1,
          paginationBar: null,
        }),
      ])
  );
}