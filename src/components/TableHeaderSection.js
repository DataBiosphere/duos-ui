import { Styles } from '../libs/theme';
import { div, img } from 'react-hyperscript-helpers';

export const TableHeaderSection = (props) => {
  const { icon, title, description } = props;

  return div({ style: { display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' } }, [
    div(
      { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
      [
        div({ style: Styles.ICON_CONTAINER }, [
          img({
            id: 'dataset-icon',
            src: icon,
            style: Styles.HEADER_IMG,
          }),
        ]),
        div({ style: Styles.HEADER_CONTAINER }, [
          div({
            style: {
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem'
            }
          }, [
            title,
          ]),
          div(
            {
              style: {
                fontFamily: 'Montserrat',
                fontSize: '1.4rem',
              },
            },
            [description]
          ),
        ]),
      ]
    ),
  ]);
};

export default TableHeaderSection;
