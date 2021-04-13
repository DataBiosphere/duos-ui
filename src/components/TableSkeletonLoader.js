import { div } from 'react-hyperscript-helpers';
import { Styles } from '../libs/theme';

export default function DarTableSkeletonLoader(props) {

  const tableHeaderTemplate = props.tableHeaderTemplate;

  const blockStyleOverwrite = {
    display: 'flex',
    height: '48px'
  };

  const headerRowStyle = Object.assign({}, Styles.TABLE.HEADER_ROW, blockStyleOverwrite);
  const tableRowStyle = Object.assign({}, Styles.TABLE.RECORD_ROW, blockStyleOverwrite);
  const footerRowStyle = Object.assign({}, Styles.TABLE.FOOTER, blockStyleOverwrite);
  const modifiedTableRowStyle = {...tableRowStyle, borderTop: '1px solid rgba(109, 110, 112, 0.2)'};

  const generateLoaderTemplate = () => {
    let start = 1;
    const end = 10;
    const template = [div({
      style: headerRowStyle,
      className: 'table-header-footer-loader'
    }, tableHeaderTemplate)];

    while(start <= end) {
      const targetStyle = start > 1 ? modifiedTableRowStyle : tableRowStyle;
      template.push(div({style: targetStyle, className: 'table-row-loader'}));
      start++;
    }
    template.push(div({style: footerRowStyle, className: 'table-header-footer-loader'}));

    return template;
  };

  return (
    div({style: Styles.TABLE.CONTAINER}, generateLoaderTemplate())
  );
}