import { isNil } from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Styles } from '../libs/theme';

//Component that renders skeleton loader on loading
const SkeletonLoader = ({columnRow, columnHeaders, baseStyle, tableSize}) => {
  const rowTemplateArray = (columnRow, columnHeaders) => {
    const rowsSkeleton = [columnRow];
    let i = 0;
    while(i < tableSize) {
      let row = columnHeaders.map(({cellStyle}) => {
        const style = Object.assign({height: '3rem'}, baseStyle, cellStyle);
        return div({style, className: 'text-placeholder'});
      });
      rowsSkeleton.push(div({style: baseStyle}, row));
      i++;
    }
    return rowsSkeleton;
  };

  return rowTemplateArray(columnRow, columnHeaders);
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
  return div({style: baseStyle,}, rowData.map((row, index) => {
    return row.map(({data, style, onClick, isComponent}) => {
      let output;
      //if component is passed in, render the component
      if (isComponent) {
        output = data;
      //if there is no onClick function, render as simple cell
      } else if (isNil(onClick)) {
        output = h(SimpleTextCell, { text: data, style, key: `filtered-list-${index}-${data}` });
      } else {
        //otherwise render as on click cell
        output = h(OnClickTextCell, { text: data, style, onClick: () => onClick(index), key: `filtered-list-${index}-${data}` });
      }
      return output;
    });
  }));
};

export default function SimpleTable(props) {
  //rowData is an array of arrays, outer array represents the row, inner array represents the array of rendered cells (should be components)
  //columnHeaders is an array of objects, [{label, style}], where style is used to set up dimentions of the cell (but can be used for more)
  const {
    columnHeaders = [],
    //array of objects, {data, isSimple, isComponent}
    //rowData -> {text, component, style, onClick}
    rowData = [],
    isLoading,
    styles, //styles -> baseStyle, columnStyle, recordStyle
    tableSize
  } = props;

  const {baseStyle, columnStyle} = styles;
  const columnRow = h(ColumnRow, {columnHeaders, baseStyle, columnStyle});
  const tableTemplate = [columnRow, h(DataRows, {rowData, baseStyle})];
  const output = isLoading ? h(SkeletonLoader, {columnRow, columnHeaders, baseStyle, tableSize}) : tableTemplate;

  return div({className: 'table-data', style: Styles.TABLE.CONTAINER}, [output]);
}
