import { div } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';

export default function DarTableSkeletonLoader() {


  const blockStyleOverwrite = {
    display: 'block',
    height: '48px'
  };

  const headerRowStyle = Object.assign({}, Styles.TABLE.HEADER_ROW, blockStyleOverwrite);
  const tableRowStyle = Object.assign({}, Styles.TABLE.RECORD_ROW, blockStyleOverwrite);
  const footerRowStyle = Object.assign({}, Styles.TABLE.FOOTER, blockStyleOverwrite);

  const generateLoaderTemplate = () => {
    let start = 1;
    const end = 10;
    const template = [div({style: headerRowStyle, className: 'table-header-footer-loader'})];

    while(start <= end) {
      template.push(div({style: tableRowStyle, className: 'table-row-loader'}));
      start++;
    }
    template.push(div({style: footerRowStyle, className: 'table-header-footer-loader'}));

    return template;
  };

  return (
    div({style: Styles.TABLE.CONTAINER}, generateLoaderTemplate())
  );
}