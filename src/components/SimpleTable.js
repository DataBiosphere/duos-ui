import React from 'react';
import { isNil } from 'lodash/fp';
import { Styles } from '../libs/theme';
import ReactTooltip from 'react-tooltip';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { SpinnerComponent } from '../components/SpinnerComponent';
import loadingImage from '../images/loading-indicator.svg';

// Renders spinning circle while table loading
const TableLoading = () => {
  return (
    <div className="table-loading-placeholder">
      <SpinnerComponent
        show={true}
        name="loadingSpinner"
        loadingImage={loadingImage}
      />
    </div>
  );
};

//Simple cell text display
const SimpleTextCell = ({ text, style }) => {
  text = isNil(text) ? '- -' : text;
  return (
    <div style={style} role="cell">
      {text}
    </div>
  );
};

//Simple cell text that carries onClick functionality
const OnClickTextCell = ({ text, style, onClick }) => {
  text = isNil(text) ? '- -' : text;
  return (
    <div style={style} onClick={onClick} role="cell">
      {text}
    </div>
  );
};

//Column component that renders the column row based on column headers
const ColumnRow = ({columnHeaders, baseStyle, columnStyle, sort, onSort}) => {
  const rowStyle = Object.assign({}, baseStyle, columnStyle);
  return (
    <div style={rowStyle} key="column-row-container" role="row">
      {columnHeaders.map((header, colIndex) => {
        const { cellStyle, label } = header;
        //style here pertains to styling for individual cells
        //should be used to set dimensions of specific columns
        return (
          <div style={cellStyle} key={`column-row-${label}`} className="column-header">
            {header.sortable && onSort ? (
              <div
                style={Styles.TABLE.HEADER_SORT}
                key="data_id_cell"
                className="cell-sort"
                onClick={() => {
                  onSort({
                    colIndex: colIndex,
                    dir: sort.colIndex === colIndex ? sort.dir * -1 : 1
                  });
                }}
              >
                {label}
                <div className="sort-container">
                  <ArrowDropUp className={`sort-icon sort-icon-up ${sort.colIndex === colIndex && sort.dir === -1 ? 'active' : ''}`} />
                  <ArrowDropDown className={`sort-icon sort-icon-down ${sort.colIndex === colIndex && sort.dir === 1 ? 'active' : ''}`} />
                </div>
              </div>
            ) : (
              label
            )}
          </div>
        );
      })}
    </div>
  );
};

//Row component that renders out rows for each element in the provided data collection
const DataRows = ({rowData, baseStyle, columnHeaders, rowWrapper = ({renderedRow}) => renderedRow}) => {
  return rowData.map((row, index) => {
    const id = rowData[index][0].id;
    const mapKey = id || `noId-index-${index}`;
    const renderedRow = (
      <div style={Object.assign({borderTop: '1px solid #f3f6f7'}, baseStyle)} key={`row-data-${mapKey}`} role="row" className={`row-data-${index}`}>
        {row.map(({data, style, onClick, isComponent, id, label}, cellIndex) => {
          let output;
          //columnHeaders determine width of the columns,
          //therefore extract width from columnHeader and apply to cell style
          const columnWidthStyle = columnHeaders[cellIndex].cellStyle;
          const appliedStyle = Object.assign({}, style, columnWidthStyle);
          //assume component is in hyperscript format
          //wrap component in dive with columnWidth applied
          if (isComponent) {
            output = (
              <div role="cell" style={columnWidthStyle} key={`${!isNil(data) && !isNil(data.key) ? data.key : 'component-' + index + '-' + cellIndex}-container`}>
                {data}
              </div>
            );
          //if there is no onClick function, render as simple cell
          } else if (isNil(onClick)) {
            output = (
              <SimpleTextCell text={data} style={appliedStyle} key={`filtered-list-${id}-${label}`} cellIndex={cellIndex} />
            );
          } else {
            //otherwise render as on click cell
            output = (
              <OnClickTextCell text={data} style={appliedStyle} onClick={() => onClick(index)} key={`filtered-list-${id}-${label}`} cellIndex={cellIndex} />
            );
          }
          return output;
        })}
      </div>
    );

    return rowWrapper({renderedRow, rowData: row});
  });

};

//Simple table component, can be used alone, can be built on top of (like with LibraryCardTable)
//component handles simple rendering of table, however logic behind pagination and row format has to be computed as the parent
export default function SimpleTable(props) {
  //rowData -> array of arrays, outer array represents the collection of rows, inner array represents the collection of cells within a particular row
  //ex -> [[{cellData1Row1}], [{cellData1Row2}]], where inner objects contain relevant data for render (text, style, component (if provided))
  //columnHeaders is an array of objects, [{label, cellStyle}], where style is used to set up dimensions of the cell for the columns

  const {
    columnHeaders = [],
    rowData = [], //rowData -> {data, component, style, onClick}
    isLoading,
    styles, //styles -> baseStyle, columnStyle needed to determine sizing and color assignments
    rowWrapper = ({renderedRow}) => renderedRow, // ({rowData, renderedRow}) => ... : allows injecting custom container to row
    paginationBar,
    sort,
    onSort
  } = props;

  const {baseStyle, columnStyle, containerOverride} = styles;
  const columnRow = <ColumnRow key="column-row-container" columnHeaders={columnHeaders} baseStyle={baseStyle} columnStyle={columnStyle} sort={sort} onSort={onSort} />;
  const tableTemplate = [ columnRow, <DataRows rowData={rowData} baseStyle={baseStyle} columnHeaders={columnHeaders} rowWrapper={rowWrapper} key="table-data-rows" /> ];
  const output = isLoading ? <TableLoading /> : tableTemplate;
  return (
    <div>
      <div className="table-data" style={containerOverride || Styles.TABLE.CONTAINER} role="table">
        {output}
        {isNil(paginationBar) ? <div /> : paginationBar}
      </div>
      <ReactTooltip
        place="left"
        effect="solid"
        multiline={true}
        className="tooltip-wrapper"
      />
    </div>
  );
}
