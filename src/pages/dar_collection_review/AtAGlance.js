import {div, h, td, th, table, thead, tbody, tr} from 'react-hyperscript-helpers';
import {useState} from 'react';
import SimpleTable from '../../components/SimpleTable';
import {Styles} from '../../libs/theme';
import PaginationBar from '../../components/PaginationBar';

export default function AtAGlance(props) {
  const [collection, setCollection] = useState(props.collection);
  const [dataUseBuckets, setDataUseBuckets] = useState(props.dataUseBuckets);
  const [styles, setStyles] = useState(props.styles);

  return (
    div({},
      [
        div({className: 'at-a-glance-subheader', style: styles.title},
          ['At A Glance']),
        table({}, [
          thead({}, [
            tr({}, [
              th({}, ["Header"])
            ])
          ]),
          tbody({}, [
            tr({}, [
              td({}, ["Cell Data"])
            ])
          ])
        ])
      ])
  );
}