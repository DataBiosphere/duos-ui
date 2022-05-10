import { div, h5, span, } from 'react-hyperscript-helpers';
import { formatDate } from '../libs/utils';

export default function CollectionAlgorithmDecision(props) {
  const {algorithmResult = {}, styleOverride = {}} = props;
  const { createDate, id, result } = algorithmResult;

  const containerProps = {
    id: `collection-algorithm-id-${id}`,
    style: Object.assign(
      {
        padding: '4%',
        fontFamily: 'Montserrat',
        flex: 1,
        display: 'flex',
        justifyContent: 'space-around'
      },
      styleOverride
    )
  };

  return (
    div(containerProps, [
      div({flex: 1}, [
        h5({style: {fontWeight: 800, fontSize: '1.8rem'}}, ['DUOS Algorithm Decision']),
        div({style: {fontSize: '1.5rem'}}, [
          span({style: {paddingRight: '1%'}}, ['Decision:']),
          span({style: {fontWeight: 400}}, [result || 'N/A'])
        ]),
        div({style: {fontSize: '1.5rem'}}, [
          span({style: {paddingRight: '1%'}}, ['Date:']),
          span({style: {fontWeight: 400}}, [formatDate(createDate) || 'N/A'])
        ])
      ])
    ])
  );
}