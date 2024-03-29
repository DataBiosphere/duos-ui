import React from 'react';
import { Chart } from 'react-google-charts';
import { isNil, isEmpty } from 'lodash/fp';
import { map } from 'lodash';
import { useMemo } from 'react';

const pieSliceColors = {
  0: { color: '#1FA371' },
  1: { color: '#DA000E' },
  2: { color: '#979797' }
};

const processVotes = (votes) => {
  const headerData = ['Vote', 'Total Votes'];
  const decisionMap = {
    'Yes': 0,
    'No': 0,
    'Not Yet Voted': 0
  };

  votes.forEach((v) => {
    const value = v.vote ? 'Yes' : !isNil(v.vote) ? 'No' : 'Not Yet Voted';
    decisionMap[value]++;
  });
  const decisionDataArray = map(decisionMap, (count, key) => [key, count]);
  return [headerData, ...decisionDataArray];
};

export default function VotesPieChart(props) {
  const {
    votes = [],
    keyString,
    pieHole = 0.3,
    height = 'inherit',
    width = '100%',
    style = { width: '70%' },
    styleOverride,
  } = props;

  const processedVotes = useMemo(() => processVotes(votes), [votes]);
  const options = {
    pieHole,
    is3d: false,
    fontName: 'Montserrat',
    pieSliceText: 'none',
    slices: pieSliceColors,
  };

  if (isEmpty(votes)) {
    return (
      <div style={style} className={`${keyString}-pie-chart-no-data`}>
        No data for {keyString}
      </div>
    );
  }
  return (
    <div style={{ ...style, ...styleOverride }}>
      <Chart
        chartType="PieChart"
        data={processedVotes}
        options={options}
        width={width}
        height={height}
      />
    </div>
  );
}
