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
        const style = Object.assign({height: '3rem', padding: 0, margin: '1rem 1%'}, baseStyle, cellStyle);
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
  text = isNil(text) ? '- -' : text;
  return div({ style }, [text]);
};

//Simple cell text that carries onClick functionality
const OnClickTextCell= ({ text, style, onClick }) => {
  text = isNil(text) ? '- -' : text;
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
const DataRows = ({rowData, baseStyle, columnHeaders}) => {
  return div({style: baseStyle,}, rowData.map((row, index) => {
    return row.map(({data, style, onClick, isComponent}, cellIndex) => {
      let output;
      //columnHeaders determine width of the columns,
      //therefore extract width from columnHeader and apply to cell style
      const columnWidthStyle = columnHeaders[cellIndex].cellStyle;
      const appliedStyle = Object.assign({}, style, columnWidthStyle);

      //assume component is in hyperscript format
      //wrap component in dive with columnWidth applied
      if (isComponent) {
        output = div(columnWidthStyle, [data]);
      //if there is no onClick function, render as simple cell
      } else if (isNil(onClick)) {
        output = h(SimpleTextCell, { text: data, style: appliedStyle, key: `filtered-list-${index}-${data}`, cellIndex });
      } else {
        //otherwise render as on click cell
        output = h(OnClickTextCell, { text: data, style: appliedStyle, onClick: () => onClick(index), key: `filtered-list-${index}-${data}`, cellIndex });
      }
      return output;
    });
  }));
};

export default function SimpleTable(props) {
  //rowData is an array of arrays, outer array represents the row, inner array represents the array of rendered cells (should be components)
  //columnHeaders is an array of objects, [{label, cellStyle}], where style is used to set up dimentions of the cell for the columns
  const {
    columnHeaders = [],
    //array of objects, {data, isSimple, isComponent}
    //rowData -> {text, component, style, onClick}
    rowData = [],
    isLoading,
    styles, //styles -> baseStyle, columnStyle, recordStyle
    tableSize,
    paginationBar
  } = props;

  const {baseStyle, columnStyle} = styles;
  const columnRow = h(ColumnRow, {columnHeaders, baseStyle, columnStyle});
  const tableTemplate = [columnRow, h(DataRows, {rowData, baseStyle, columnHeaders})];
  const output = isLoading ? h(SkeletonLoader, {columnRow, columnHeaders, baseStyle, tableSize}) : tableTemplate;

  return div({className: 'table-data', style: Styles.TABLE.CONTAINER}, [output, paginationBar]);
}
