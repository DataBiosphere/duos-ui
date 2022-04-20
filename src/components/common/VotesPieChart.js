import { Chart } from 'react-google-charts';
import { h, div } from 'react-hyperscript-helpers';
import { isNil, isEmpty} from 'lodash/fp';
import { map } from 'lodash';
import { useMemo } from 'react';

const pieSliceColors = {
  0: {color: 'green'},
  1: {color: 'red'},
  2: {color: 'gray'}
};

const processVotes = (votes) => {
  const headerData = ["Vote", "Total Votes"];
  const decisionMap = {
    "Yes" : 0,
    "No": 0,
    "Not submitted" : 0
  };

  votes.forEach((v) => {
    const value = v.vote ? "Yes" : !isNil(v.vote) ? "No" : "Not submitted";
    decisionMap[value]++;
  });
  const decisionDataArray = map(decisionMap, (count, key) => [key, count]);
  return [headerData, ...decisionDataArray];
};

export default function VotesPieChart(props) {
  const {
    votes = [],
    keyString,
    title = 'Pie Chart Results',
    pieHole = 0.3,
    height = 'inherit',
    width = 'inherit',
    style = { padding: '20px 0'}
  } = props;

  const processedVotes = useMemo(() => processVotes(votes), [votes]);
  const options = {
    title,
    pieHole,
    is3d: false,
    fontName: 'Montserrat',
    pieSliceText: 'none',
    slices: pieSliceColors
  };

  if(isEmpty(votes)) {
    return div({style, className: `${keyString}-pie-chart-no-data`}, [`No data for ${keyString}`]);
  }
  return div({display: 'flex', style}, [
    h(Chart, {
      chartType:"PieChart",
      data: processedVotes,
      options: options,
      width,
      height
    })
  ]);
}