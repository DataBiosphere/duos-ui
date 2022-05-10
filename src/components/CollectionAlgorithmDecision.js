import { div, h5, span, } from 'react-hyperscript-helpers';
import { formatDate } from '../libs/utils';
import{ isNil } from 'lodash/fp';

export default function CollectionAlgorithmDecision(props) {
  const {algorithmResult = {}, styleOverride = {}} = props;
  const { createDate, id, result } = algorithmResult;

  const containerProps = {
    id: `collection-algorithm-id-${id}`,
    style: Object.assign(
      {
        padding: '4%',
        flex: 1,
        display: 'flex',
        justifyContent: 'space-around',
        fontFamily: 'Montserrat'
      },
      styleOverride
    )
  };

  return (
    div(containerProps, [
      div({style: {flex: 1,}}, [
        h5({id: `collection-${id}-subtitle`, style: {fontWeight: 800, fontSize: '1.8rem'}}, ['DUOS Algorithm Decision']),
        div({style: {fontSize: '1.5rem'}}, [
          span({id: `collection-${id}-decision-label`, style: {paddingRight: '1%'}}, ['Decision:']),
          span({id: `collection-${id}-decision-value`, style: {fontWeight: 400}}, [result || 'N/A'])
        ]),
        div({style: {fontSize: '1.5rem'}}, [
          span({id: `collection-${id}-date-label`, style: {paddingRight: '1%'}}, ['Date:']),
          span({id: `collection-${id}-date-value`, style: {fontWeight: 400}}, [!isNil(createDate) ? formatDate(createDate) : 'N/A'])
        ])
      ])
    ])
  );
}