import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Styles, Theme } from '../../libs/theme'
import { Link } from 'react-router-dom'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList } from '../../libs/utils'
import SearchBar from '../../components/SearchBar'
import { DataSet } from '../../libs/ajax/DataSet'
import DatasetSubmissionsTable from './DatasetSubmissionsTable'
import { Storage } from '../../libs/storage'
import styles from './DatasetTerms.module.css'
import TableHeaderSection from 'src/components/TableHeaderSection'

export default function DatasetSubmissions() {
  const [terms, setTerms] = useState([])
  const [filteredTerms, setFilteredTerms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState({})
  const searchRef = useRef('')

  useEffect(() => {
    const init = async () => {
      const user = Storage.getCurrentUser()
      setCurrentUser(user)
      const query = {
        from: 0,
        size: 10000,
        query: {
          bool: {
            must: [
              {
                match: {
                  _type: 'dataset',
                },
              },
              {
                bool: {
                  should: [
                    {
                      term: {
                        createUserId: {
                          value: user.userId,
                        },
                      },
                    },
                    {
                      term: {
                        'study.dataSubmitterId': {
                          value: user.userId,
                        },
                      },
                    },
                    {
                      term: {
                        'study.dataCustodianEmail': {
                          value: user.email,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      }
      setIsLoading(true)
      try {
        const queryTerms = await DataSet.searchDatasetIndex(query)
        setTerms(queryTerms)
        setFilteredTerms(queryTerms)
      }
      catch (_error) {
        Notifications.showError({ text: 'Error initializing datasets table' })
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const handleSearchChange = useCallback(searchTerms => searchOnFilteredList(
    searchTerms,
    terms,
    getSearchFilterFunctions().datasetTerms,
    setFilteredTerms,
  ), [terms])

  const addDatasetButtonStyle = {
    color: Theme.palette.link,
    backgroundColor: 'white',
    border: '1px solid',
    borderColor: Theme.palette.link,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.45rem',
    height: 44,
    padding: '0 16px',
    cursor: 'default',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginRight: 5,
    marginTop: 10,
  }

  const addDatasetButton = (currentUser.isDataSubmitter)
    ? (
        <button style={addDatasetButtonStyle}>
          <AddCircleOutlineIcon />
          <Link to="/data_submission_form" style={{ marginLeft: 5 }}>Add Dataset</Link>
        </button>
      )
    : (
        <button style={Object.assign({}, addDatasetButtonStyle, { cursor: 'not-allowed' })} disabled={true}>
          <AddCircleOutlineIcon />
          <span style={{ marginLeft: 5 }}>Add Dataset</span>
        </button>
      )

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My Data Submissions"
          description="View the status of datasets registered in DUOS"
        />
        <div style={{ ...Styles.MEDIUM_DESCRIPTION, fontSize: '16px', marginTop: '1rem', marginLeft: '1.75em', textAlign: 'justify', width: '70%' }}>
          <p>DUOS accepts registration of either <b>Open Access</b> or <b>Controlled Access data</b>.</p>
          <p>Controlled access data registered in DUOS can be managed by a DAC within DUOS or by an external system that the dataset information in DUOS links to [ex. dbGaP, EGA etc]. To register controlled access data with a DAC in DUOS, may need to provide the receiving DAC with documentation and/or agreements. These agreements can be submitted during the DUOS registration process or handled externally through direct communication with the DAC. DUOS is not responsible for the content, review, offer, or acceptance of such agreements.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', marginLeft: '2em', marginTop: '1rem' }}>
          <div>{addDatasetButton}</div>
          <SearchBar
            handleSearchChange={handleSearchChange}
            searchRef={searchRef}
          />
        </div>
      </div>
      <div className={styles['term-table-container']}>
        <DatasetSubmissionsTable terms={filteredTerms} isLoading={isLoading} />
      </div>
    </div>
  )
}
