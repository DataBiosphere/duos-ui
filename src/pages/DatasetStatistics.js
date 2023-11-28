import React from 'react';
import { useState, useEffect } from 'react';
import { Metrics } from '../libs/ajax';
import { Notifications } from '../libs/utils';
import { Styles, Theme } from '../libs/theme';
import { get, find } from 'lodash';
import { ReadMore } from '../components/ReadMore';
import { formatDate } from '../libs/utils';

const LINE = <div style={{ borderTop: '1px solid #BABEC1', height: 0 }} />;

export default function DatasetStatistics(props) {
  const datasetId = props.match.params.datasetId;
  const [dataset, setDataset] = useState();
  const [dars, setDars] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setData(datasetId);
  }, [datasetId]);

  const setData = async (datasetId) => {
    try {
      setIsLoading(true);
      const metrics = await Metrics.getDatasetStats(datasetId);
      setDataset(metrics.dataset);
      setDars(metrics.dars);
      setIsLoading(false);
    } catch (error) {
      Notifications.showError({ text: 'Error: Unable to retrieve dataset statistics from server' });
      setIsLoading(false);
    }
  };

  if (!isLoading) {
    return (
      <div style={{ ...Styles.PAGE, color: Theme.palette.primary }}>
        <div style={{ justifyContent: 'space-between' }}>
          <div style={{ marginTop: '25px' }}>
            <div style={Styles.TITLE}>Dataset Statistics</div>
            <div style={Styles.MEDIUM_ROW}>
              <div style={{ fontWeight: '500', marginRight: '5px' }}>Dataset ID: </div>
              <div>{dataset?.alias}</div>
            </div>
            <div style={Styles.MEDIUM_ROW}>
              <div style={{ fontWeight: '500', marginRight: '5px' }}>Dataset Name: </div>
              <div>
                {get(
                  find(dataset?.properties, (p) => {
                    return p.propertyName === 'Dataset Name';
                  }),
                  'propertyValue',
                  ''
                )}
              </div>
            </div>
          </div>
          <div style={Styles.SUB_HEADER}>Dataset Information</div>
          <div style={{ display: 'flex' }}>
            <div style={Styles.DESCRIPTION_BOX}>
              <div style={{ ...Styles.MINOR_HEADER, paddingLeft: '10px' }}>Dataset Description:</div>
              {LINE}
              <div style={{ fontSize: Theme.font.size.small, padding: '1rem' }}>
                {get(
                  find(dataset?.properties, (p) => {
                    return p.propertyName === 'Description';
                  }),
                  'propertyValue',
                  ''
                )}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex' }}>
                <div style={Styles.SMALL_BOLD}>Number of Participants: </div>
                <div style={Styles.SMALL_BOLD}>
                  {get(
                    find(dataset?.properties, (p) => {
                      return p.propertyName === '# of participants';
                    }),
                    'propertyValue',
                    ''
                  )}
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={Styles.SMALL_BOLD}>Principal Investigator: </div>
                <div style={Styles.SMALL_BOLD}>
                  {get(
                    find(dataset?.properties, (p) => {
                      return p.propertyName === 'Principal Investigator(PI)';
                    }),
                    'propertyValue',
                    ''
                  )}
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={Styles.SMALL_BOLD}>Data Custodian: </div>
                <div style={Styles.SMALL_BOLD}>
                  {get(
                    find(dataset?.properties, (p) => {
                      return p.propertyName === 'Data Depositor';
                    }),
                    'propertyValue',
                    ''
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={Styles.SUB_HEADER}>Data Access Requests - Research Statements</div>
          {dars?.map((dar) => (
            <div style={Styles.READ_MORE} id={`${dar.darCode}`} key={`${dar.darCode}`}>
              <ReadMore
                props={props}
                readLessText="Show less"
                readMoreText="Show More"
                readStyle={{ fontWeight: 500, margin: '20px', height: 0 }}
                content={[
                  <div key='dar' style={{ display: 'flex' }}>
                    <div style={{ ...Styles.MEDIUM, width: '12%', margin: '15px' }}>{dar.darCode}</div>
                    <div style={{ ...Styles.MEDIUM, margin: '15px' }}>{dar.projectTitle}</div>
                  </div>,
                  LINE
                ]}
                moreContent={[
                  <div key='updated' style={{ display: 'flex', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', paddingRight: '2rem' }}>
                      <div style={Styles.SMALL_BOLD}>Last Updated: </div>
                      <div style={Styles.SMALL_BOLD}>{formatDate(dar.updateDate)}</div>
                    </div>
                  </div>,
                  <div key='summary' style={{ backgroundColor: 'white' }}>
                    <div style={Styles.SMALL_BOLD}>NonTechnical Summary:</div>
                    <div style={{ fontSize: Theme.font.size.small, padding: '0 1rem 1rem 1rem' }}>
                      {dar.nonTechRus}
                    </div>
                  </div>,
                  LINE
                ]
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    return null;
  }
}
