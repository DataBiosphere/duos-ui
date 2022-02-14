import { Chart } from 'react-google-charts';
import { h, div } from 'react-hyperscript-helpers';
import { isNil, startCase, isEmpty} from 'lodash/fp';
import { map } from 'lodash';
import { useMemo } from 'react';

const processVotes = (votes) => {
  const headerData = ["Vote", "Total Votes"];
  const decisionMap = {};

  votes.forEach((v) => {
    const value = startCase(v.vote) || "Not submitted";
    if(isNil(decisionMap[value])) {
      decisionMap[value] = 1;
    } else {
      decisionMap[value]++;
    }
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
    style = { padding: '10px 5px'}
  } = props;

  const processedVotes = useMemo(() => processVotes(votes), [votes]);
  const options = { title, pieHole, is3d: false, fontName: 'Montserrat'};

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