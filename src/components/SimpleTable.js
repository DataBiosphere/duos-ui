import { concat } from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Styles } from '../libs/theme';

//Component that renders skeleton loader on loading
const SkeletonLoader = ({columnRow, columnHeaders, baseStyle, tableSize}) => {
  const rowTemplateArray = (columnHeaders) => {
    const rowsSkeleton = [];
    let i = 0;
    while(i < tableSize) {
      let row = columnHeaders.map((columnData) => {
        const style = Object.assign({margin: '1rem 2%'}, baseStyle, columnData.cellStyle);
        return div({style, className: 'text-placeholder'});
      });
      rowsSkeleton.push(row);
    }
    return rowsSkeleton;
  };

  return div(
    {style: Styles.TABLE.CONTAINER},
    concat(columnRow, rowTemplateArray(columnHeaders))
  );
};

//Simple cell text display
const SimpleTextCell = ({ text, style }) => {
  return div({ style }, [text]);
};

//Simple cell text that carries onClick functionality
const OnClickTextCell= ({ text, style, onClick }) => {
  return div({ style, onClick }, [text]);
};

//Column component that renders the column row based on column headers
//NOTE: Should incorporate sorting functionality since the utils is built out
//NOTE: use this as the template for the Skeleton Loader
const ColumnRow = ({columnHeaders, baseStyle, columnStyle}) => {
  const rowStyle = Object.assign({}, baseStyle, columnStyle);
  return div({style: rowStyle}, columnHeaders.map((header) => {
    const {cellStyle, label} = header;
    //style here pertains to styling for individual cells
    //should be used to set dimensions of specific columns
    return div({style: cellStyle}, [label]);
  }));
};

//Row component that renders out rows for each element in the provided data collection
const DataRows = ({rowData, baseStyle}) => {
  return div({style: baseStyle}, rowData.map(({data, isSimple, isComponent}) => {
    let output;
    const { text, component, style, onClick } = data;
    if(isComponent) {
      output = component;
    } else if (isSimple) {
      output = h(SimpleTextCell({text, style}));
    } else {
      output = h(OnClickTextCell({text, style, onClick}));
    }
    return output;
  }));
};

//component that renders the data populated rows on a table
const TableContents = ({baseStyle, columnRow, rowData}) => {
  const data = h(DataRows, {rowData, baseStyle});
  return [columnRow, data];
};

export default function SimpleTable(props) {
  //rowData is an array of arrays, outer array represents the row, inner array represents the array of rendered cells (should be components)
  //columnHeaders is an array of objects, [{label, style}], where style is used to set up dimentions of the cell (but can be used for more)
  const {
    columnHeaders,
    //array of objects, {data, isSimple, isComponent}
    //rowData -> {text, component, style, onClick}
    rowData,
    isLoading,
    styles, //styles -> baseStyle, columnStyle, recordStyle
    tableSize
  } = props;

  const {baseStyle, columnStyle} = styles;
  const columnRow = h(ColumnRow, {columnHeaders, baseStyle, columnStyle});
  const tableTemplate = div({className: 'table-data', style: Styles.TABLE.CONTAINER}, [
    h(TableContents, {baseStyle, columnRow, rowData})
  ]);
  const output = isLoading ? tableTemplate : h(SkeletonLoader, {columnRow, columnHeaders, baseStyle, tableSize});

  return div({className: 'table-data', style: Styles.TABLE.CONTAINER}, [output]);
}
