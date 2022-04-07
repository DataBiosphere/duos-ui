import { div, input, span } from 'react-hyperscript-helpers';
import { useRef, useEffect } from 'react';
import { toNumber } from 'lodash';
import {Styles, Theme} from '../libs/theme';

//NOTE: This is a new pagination made to fit with the updated table look
//Component does not use third-party libraries for pagination, whereas the old version relies on 'react-pagination'
//Style works with Current Dar Table, but allows for modification with styles passed as a prop (though I expect to do some more fine-tuning with future implementations)
export default function PaginationBar(props) {
  const {pageCount, goToPage, changeTableSize} = props;
  const currentPage = useRef(props.currentPage);
  const tableSize = useRef(props.tableSize);
  const applyTextHover = (e) => {
    e.target.style.color = Styles.TABLE.DAR_TEXT_HOVER.color;
    e.target.style.cursor = Styles.TABLE.DAR_TEXT_HOVER.cursor;
  };

  const removeTextHover = (e, color) => {
    e.target.style.color = color;
  };

  useEffect(() => {
    currentPage.current.value = props.currentPage;
    tableSize.current.value = props.tableSize;
  }, [props.currentPage, props.tableSize]);

  return (
    div({style: Styles.TABLE.FOOTER}, [
      div({style: Styles.TABLE.PAGINATION_SECTION_OFFSET}),
      div({style: Styles.TABLE.PAGINATION_BUTTON_SECTION}, [
        div({
          style: Styles.TABLE.PAGINATION_BUTTON
        }, [
          span({
            onClick: () => goToPage(toNumber(currentPage.current.value) - 1),
            onMouseEnter: applyTextHover,
            onMouseLeave: (e) => removeTextHover(e, Theme.palette.primary),
          },['Prev']),
        ]),
        div({style: Styles.TABLE.PAGINATION_CURRENT_PAGE}, [
          span({},['Page ']),
          input({
            onChange: () => goToPage(toNumber(currentPage.current.value)),
            type: 'text',
            ref: currentPage,
            defaultValue: props.currentPage,
            style: Styles.TABLE.PAGINATION_INPUT
          }),
          span({}, [` of ${pageCount}`])
        ]),
        div({
          style: Styles.TABLE.PAGINATION_BUTTON
        }, [
          span({
            onClick: () => goToPage(toNumber(currentPage.current.value) + 1),
            onMouseEnter: applyTextHover,
            onMouseLeave: (e) => removeTextHover(e, '#1f3b50')
          }, ['Next'])
        ]),
      ]),
      div({style: Styles.TABLE.PAGINATION_TABLE_SIZE_SECTION}, [
        span({style: {marginRight: '2%'}}, ['Rows per page: ']),
        input({
          onChange: () => changeTableSize(tableSize.current.value),
          type: 'text',
          ref: tableSize,
          defaultValue: props.tableSize,
          style: Styles.TABLE.PAGINATION_INPUT
        })
      ])
    ])
  );
}