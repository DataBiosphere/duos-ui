import { div } from 'react-hyperscript-helpers';
import { Styles } from '../libs/theme';

export default function DarTableSkeletonLoader(props) {

  const { tableHeaderTemplate, tableRowLoadingTemplate } = props;

  const blockStyleOverwrite = {
    display: 'flex',
    height: '48px'
  };

  const tableRowStyle = Object.assign({}, Styles.TABLE.RECORD_ROW, blockStyleOverwrite);
  const modifiedTableRowStyle = {...tableRowStyle, borderTop: '1px solid rgba(109, 110, 112, 0.2)'};

  const generateLoaderTemplate = () => {
    let start = 1;
    const end = 10;

    const template = [div({
      style: Styles.TABLE.HEADER_ROW
    }, tableHeaderTemplate)];

    while(start <= end) {
      const targetStyle = start > 1 ? modifiedTableRowStyle : tableRowStyle;
      const rowTemplate = div({style: targetStyle}, tableRowLoadingTemplate);
      template.push(rowTemplate);
      start++;
    }
    template.push(div({style: Styles.TABLE.FOOTER}));

    return template;
  };

  return (
    div({style: Styles.TABLE.CONTAINER}, generateLoaderTemplate())
  );
}