import {div, h} from 'react-hyperscript-helpers';
import {useState} from 'react';
import SimpleTable from '../../components/SimpleTable';
import {Styles} from '../../libs/theme';

export default function AtAGlance(props) {
  const [collection, setCollection] = useState(props.collection);
  const [dataUseBuckets, setDataUseBuckets] = useState(props.dataUseBuckets);

  const styles = {
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
      header: '100%',
    },
  };

  const columnHeaderFormat = {
    headerCell: {
      label: 'Header Cell',
      cellStyle: {width: styles.cellWidth.header},
    },
  };

  const columnHeaderData = () => {
    const {headerCell} = columnHeaderFormat;
    return [headerCell];
  };

  return (
    div({},
      [
        div({className: 'at-a-glance-subheader', style: styles.title},
          ['At A Glance']),
        h(SimpleTable, {
          isLoading: false,
          rowData: [
            [
              {
                data: 'Cell Data',
                id: 1,
                style: styles,
                label: 'Cell Data',
              }]],
          columnHeaders: columnHeaderData(),
          styles: styles,
          tableSize: 1,
          paginationBar: null,
        }),
      ])
  );
}