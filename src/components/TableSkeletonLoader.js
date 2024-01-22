import React from 'react';
import { Styles } from '../libs/theme';

export default function TableSkeletonLoader(props) {
  const { tableHeaderTemplate, tableRowLoadingTemplate } = props;

  const blockStyleOverwrite = {
    display: 'flex',
    height: '48px'
  };

  const tableRowStyle = { ...Styles.TABLE.RECORD_ROW, ...blockStyleOverwrite };
  const modifiedTableRowStyle = { ...tableRowStyle, borderTop: '1px solid rgba(109, 110, 112, 0.2)' };

  const generateLoaderTemplate = () => {
    let start = 1;
    const end = 10;

    const template = [
      <div key={`row-loader-0`} style={Styles.TABLE.HEADER_ROW}>{tableHeaderTemplate}</div>
    ];

    while (start <= end) {
      const targetStyle = start > 1 ? modifiedTableRowStyle : tableRowStyle;
      const rowTemplate = (
        <div style={targetStyle} key={`row-loader-${start}`}>
          {tableRowLoadingTemplate}
        </div>
      );
      template.push(rowTemplate);
      start++;
    }
    template.push(<div style={Styles.TABLE.FOOTER} />);

    return template;
  };

  return <div style={Styles.TABLE.CONTAINER}>{generateLoaderTemplate()}</div>;
}
