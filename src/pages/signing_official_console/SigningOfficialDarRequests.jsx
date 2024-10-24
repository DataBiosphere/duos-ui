import React, {useState, useEffect} from 'react';
import {Notifications} from '../../libs/utils';
import {Styles} from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import { Collections } from '../../libs/ajax/Collections';
import { USER_ROLES } from '../../libs/utils';
import { DarCollectionTableColumnOptions, DarCollectionTable } from '../../components/dar_collection_table/DarCollectionTable';
import { consoleTypes } from '../../components/dar_collection_table/DarCollectionTableCellData';

export default function SigningOfficialDarRequests() {
  const [collectionList, setCollectionList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const collectionList = await Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial);
        setCollectionList(collectionList);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({ text: 'Error: Unable to retrieve current user from server' });
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={{ ...Styles.TITLE, marginTop: '0' }}>My Institution&apos;s Data Access Requests</div>
            <div style={{ ...Styles.MEDIUM_DESCRIPTION, fontSize: '18px' }}>
              Your Institution&apos;s Data Access Requests: Records from all current and closed data access requests.
            </div>
          </div>
        </div>
      </div>
      <div className="signing-official-tabs">
        <DarCollectionTable
          collections={collectionList}
          columns={[
            DarCollectionTableColumnOptions.DAR_CODE,
            DarCollectionTableColumnOptions.NAME,
            DarCollectionTableColumnOptions.SUBMISSION_DATE,
            DarCollectionTableColumnOptions.RESEARCHER,
            DarCollectionTableColumnOptions.INSTITUTION,
            DarCollectionTableColumnOptions.DATASET_COUNT,
            DarCollectionTableColumnOptions.STATUS,
          ]}
          isLoading={isLoading}
          cancelCollection={null}
          reviseCollection={null}
          consoleType={consoleTypes.SIGNING_OFFICIAL}
        />
      </div>
    </div>
  );
}