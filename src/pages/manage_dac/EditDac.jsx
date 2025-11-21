import { difference, filter, isEmpty, map, union } from 'lodash'
import React, { useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import { DAC } from '../../libs/ajax/DAC'
import { DAA } from '../../libs/ajax/DAA'
import { Models } from '../../libs/models'
import { Notifications, PromiseSerial } from '../../libs/utils'
import { Alert } from '../../components/Alert'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { DacUsers } from './DacUsers'
import editDACIcon from '../../images/dac_icon.svg'
import backArrowIcon from '../../images/back_arrow.svg'
import { Spinner } from '../../components/Spinner'
import { Styles } from '../../libs/theme'
import DUOSUniformDataAccessAgreement from '../../assets/DUOS_Uniform_Data_Access_Agreement.pdf'
import PublishIcon from '@mui/icons-material/Publish'
import { UploadDaaModal } from '../../components/modals/UploadDaaModal'
import { Storage } from '../../libs/storage'
import TableHeaderSection from 'src/components/TableHeaderSection'

export const CHAIR = 'chair'
export const MEMBER = 'member'

export default function EditDac() {
  const params = useParams()
  const dacId = params.dacId
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState({
    error: Models.error,
    dirtyFlag: false,
    dac: Models.dac,
    chairsSelectedOptions: [],
    chairIdsToAdd: [],
    chairIdsToRemove: [],
    membersSelectedOptions: [],
    memberIdsToAdd: [],
    memberIdsToRemove: [],
    searchInputChanged: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [newDaaId, setNewDaaId] = useState(null)
  const [selectedDaa, setSelectedDaa] = useState(null)
  const [createdDaa, setCreatedDaa] = useState(null)
  const [uploadedDAAFile, setUploadedDaaFile] = useState(null)
  const [daaFileData, setDaaFileData] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [fetchedDac, setFetchedDac] = useState(null)
  const [broadDaa, setBroadDaa] = useState(null)
  const [matchingDaas, setMatchingDaas] = useState([])
  const dacText = dacId === undefined ? 'Create a new Data Access Committee in the system' : 'Manage My Data Access Committee'

  useEffect(() => {
    const fetchData = async () => {
      if (dacId !== undefined) {
        try {
          const fetchedDac = await DAC.get(dacId)
          setFetchedDac(fetchedDac)
          const daas = await DAA.getDaas()
          const broadDaa = daas.find(daa => daa.broadDaa === true)
          setBroadDaa(broadDaa)
          setState(prev => ({ ...prev, dac: fetchedDac }))
          const matchingDaas = daas.filter(daa => daa.initialDacId === fetchedDac.dacId)
          setMatchingDaas(matchingDaas)
          const daa = fetchedDac?.associatedDaa ? fetchedDac.associatedDaa : null
          setSelectedDaa(daa?.daaId ? daa : null)
        }
        catch (_e) {
          Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
        }
      }
      else {
        try {
          const daas = await DAA.getDaas()
          const broadDaa = daas.find(daa => daa.broadDaa === true)
          setBroadDaa(broadDaa)
        }
        catch (_e) {
          Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
        }
      }
    }
    fetchData()
    setIsLoading(false)
  }, [dacId, setState])

  const okHandler = async (event) => {
    event.preventDefault()
    const user = Storage.getCurrentUser()
    let currentDac = state.dac
    if (state.dirtyFlag) {
      if (dacId !== undefined) {
        await DAC.update(currentDac.dacId, currentDac.name, currentDac.description, currentDac.email)
      }
      else {
        if (daaFileData === null && selectedDaa.daaId !== broadDaa.daaId) {
          handleErrors('Please select either the default agreement or upload your own agreement before saving.')
          return
        }
        else if (user.isAdmin && daaFileData !== null && selectedDaa === undefined) {
          currentDac = await DAC.create(currentDac.name, currentDac.description, currentDac.email)
          const createdDaa = await DAA.createDaa(daaFileData, currentDac.dacId)
          setCreatedDaa(createdDaa.data)
        }
        else {
          if (user.isAdmin) {
            currentDac = await DAC.create(currentDac.name, currentDac.description, currentDac.email)
          }
        }
      }

      // Order here is important. Since users cannot have multiple roles in the
      // same DAC, we have to make sure we remove users before re-adding any
      // back in a different role.
      // Chairs are a special case since we cannot remove all chairs from a DAC
      // so we handle that case first.
      const ops0 = state.chairIdsToAdd.map(id => () => DAC.removeDacMember(currentDac.dacId, id))
      const ops1 = state.memberIdsToRemove.map(id => () => DAC.removeDacMember(currentDac.dacId, id))
      const ops2 = state.chairIdsToAdd.map(id => () => DAC.addDacChair(currentDac.dacId, id))
      const ops3 = state.chairIdsToRemove.map(id => () => DAC.removeDacChair(currentDac.dacId, id))
      const ops4 = state.memberIdsToAdd.map(id => () => DAC.addDacMember(currentDac.dacId, id))
      const ops5 = newDaaId !== null && selectedDaa !== undefined ? [() => DAA.addDaaToDac(newDaaId, currentDac.dacId)] : []
      const allOperations = ops0.concat(ops1, ops2, ops3, ops4, ops5)
      const responses = await PromiseSerial(allOperations)
      const errorCodes = filter(responses, r => JSON.stringify(r) !== '200' && JSON.stringify(r.status) !== '201')
      if (!isEmpty(errorCodes)) {
        handleErrors('There was an error saving DAC information. Please verify that the DAC is correct by viewing the current information.')
      }
      else {
        closeHandler()
      }
    }
  }

  const closeHandler = () => {
    navigate('/manage_dac')
  }

  const handleErrors = (message) => {
    Notifications.showError({ text: message })
  }

  const chairSearch = (query, callback) => {
    // A valid chair is any user:
    //    * minus current chairs
    //    * minus current members (you shouldn't be both a chair and a member)
    //    * minus any new members selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    //    * plus any chairs that are slated for removal

    const invalidChairs = difference(
      union(
        map(state.dac.chairpersons, 'userId'),
        map(state.dac.members, 'userId'),
        state.memberIdsToAdd),
      state.memberIdsToRemove,
      state.chairIdsToRemove)
    userSearch(invalidChairs, query, callback)
  }

  const memberSearch = (query, callback) => {
    // A valid member is any user:
    //    * minus current members
    //    * minus current chairs (you shouldn't be both a chair and a member)
    //    * minus any new chairs selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    //    * plus any chairs that are slated for removal

    const invalidMembers = difference(
      union(
        map(state.dac.members, 'userId'),
        map(state.dac.chairpersons, 'userId'),
        state.chairIdsToAdd),
      state.memberIdsToRemove,
      state.chairIdsToRemove)
    userSearch(invalidMembers, query, callback)
  }

  const userSearch = (invalidUserIds, query, callback) => {
    DAC.autocompleteUsers(query).then(
      (items) => {
        const filteredUsers = filter(items, (item) => {
          return !invalidUserIds.includes(item.userId)
        })
        const options = filteredUsers.map(function (item) {
          return {
            key: item.userId,
            value: item.userId,
            label: item.displayName + ' (' + item.email + ')',
            item: item,
          }
        })
        callback(options)
      },
      (rejected) => {
        handleErrors(rejected)
      })
  }

  const onChairSearchChange = (data) => {
    setState(prev => ({
      ...prev,
      chairIdsToAdd: map(data, 'item.userId'),
      chairsSelectedOptions: data,
      dirtyFlag: true,
    }))
  }

  const onMemberSearchChange = (data) => {
    setState(prev => ({
      ...prev,
      memberIdsToAdd: map(data, 'item.userId'),
      membersSelectedOptions: data,
      dirtyFlag: true,
    }))
  }

  const onSearchInputChanged = () => {
    setState(prev => ({
      ...prev,
      searchInputChanged: true,
    }))
  }

  const onSearchMenuClosed = () => {
    setState(prev => ({
      ...prev,
      searchInputChanged: false,
    }))
  }

  const handleChange = (event) => {
    const target = event.target
    const value = target.value
    const name = target.name

    setState((prev) => {
      const newDac = Object.assign({}, prev.dac)
      newDac[name] = value
      return {
        ...prev,
        dac: newDac,
        dirtyFlag: true,
      }
    })
  }

  const removeDacMember = (_dacId, userId, role) => {
    switch (role) {
      case CHAIR:
        if (state.chairIdsToRemove.includes(userId)) {
          setState(prev => ({
            ...prev,
            chairIdsToRemove: difference(prev.chairIdsToRemove, [userId]),
            dirtyFlag: true,
          }))
        }
        else {
          setState(prev => ({
            ...prev,
            chairIdsToRemove: union(prev.chairIdsToRemove, [userId]),
            dirtyFlag: true,
          }))
        }
        break
      case MEMBER:
        if (state.memberIdsToRemove.includes(userId)) {
          setState(prev => ({
            ...prev,
            memberIdsToRemove: difference(prev.memberIdsToRemove, [userId]),
            dirtyFlag: true,
          }))
        }
        else {
          setState(prev => ({
            ...prev,
            memberIdsToRemove: union(prev.memberIdsToRemove, [userId]),
            dirtyFlag: true,
          }))
        }
        break
      default:
        break
    }
  }

  const handleAttachment = async (attachment) => {
    if (dacId !== undefined) {
      setUploadedDaaFile(attachment)
      setDaaFileData(attachment[0])
      const createdDaa = await DAA.createDaa(attachment[0], state.dac.dacId)
      setCreatedDaa(createdDaa.data)
      setState(prev => ({
        ...prev,
        dirtyFlag: true,
      }))
    }
    else {
      setUploadedDaaFile(attachment)
      setDaaFileData(attachment[0])
      setState(prev => ({
        ...prev,
        dirtyFlag: true,
      }))
      setSelectedDaa(undefined)
    }
  }

  const handleDaaChange = (daaId) => {
    if (daaId === undefined) {
      setSelectedDaa(undefined)
      setState(prev => ({
        ...prev,
        dirtyFlag: true,
      }))
    }
    else {
      setSelectedDaa({ ...selectedDaa, daaId: daaId })
      setNewDaaId(daaId)
      setState(prev => ({
        ...prev,
        dirtyFlag: true,
      }))
    }
  }

  const DaaItem = ({ specificDaa }) => (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
      <input
        type="radio"
        name="daa"
        checked={selectedDaa.daaId === specificDaa.daaId}
        onChange={() => handleDaaChange(specificDaa.daaId)}
        style={{ accentColor: '#00609f' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
        <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
          <div className="row" style={{ paddingLeft: '15px' }}>
            {specificDaa.file.fileName}
          </div>
          <div className="row" style={{ fontSize: '1rem', paddingLeft: '15px' }}>
            Uploaded on
            {' '}
            {specificDaa?.updateDate ? new Date(specificDaa.updateDate).toLocaleDateString() : ''}
          </div>
        </div>
        <div style={{ flexBasis: '25%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
          <div style={{ marginLeft: '10px' }}>
            <a
              target="_blank"
              rel="noreferrer"
              download={specificDaa.file.fileName}
              onClick={() => {
                DAA.getDaaFileById(specificDaa.daaId, specificDaa.file.fileName)
              }}
              className="button button-white"
              style={{ padding: '10px 12px' }}
            >
              <span className="glyphicon glyphicon-download-alt"></span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    isLoading
      ? <Spinner />
      : (
          <div style={Styles.PAGE}>
            <div>
              <Link
                id="link_manage_dac"
                to="/manage_dac"
                className="navbar-brand"
                style={{ paddingRight: '16px', marginTop: '3rem' }}
              >
                <img id="back-arrow-icon" src={backArrowIcon} style={{ ...Styles.HEADER_IMG, width: '30px' }} alt="Back" />
              </Link>
              <TableHeaderSection
                icon={editDACIcon}
                title={dacText}
                description={dacId === undefined ? 'Create DAC' : fetchedDac?.name}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '2rem' }}>
              <div style={{ flexBasis: '50%', flexGrow: 0, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <form
                    className="form-horizontal css-form"
                    name="dacForm"
                    noValidate
                    encType="multipart/form-data"
                    style={{ width: '83.33%', maxWidth: '1200px' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                      <label id="lbl_dacName" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
                        DAC
                        Name
                      </label>
                      <div style={{ flexBasis: '66.67%' }}>
                        <input
                          id="txt_dacName"
                          type="text"
                          defaultValue={state.dac.name}
                          onChange={handleChange}
                          name="name"
                          className="form-control vote-input"
                          required={true}
                          data-cy="dac_name"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                      <label
                        id="lbl_dacDescription"
                        style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}
                      >
                        DAC Description
                      </label>
                      <div style={{ flexBasis: '66.67%' }}>
                        <textarea
                          id="txt_dacDescription"
                          defaultValue={state.dac.description}
                          onChange={handleChange}
                          name="description"
                          className="form-control vote-input"
                          required={true}
                          data-cy="dac_description"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                      <label id="lbl_dacEmail" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
                        DAC
                        Email
                      </label>
                      <div style={{ flexBasis: '66.67%' }}>
                        <input
                          id="txt_dacEmail"
                          type="text"
                          defaultValue={state.dac.email}
                          onChange={handleChange}
                          name="email"
                          className="form-control vote-input"
                          required={true}
                          data-cy="dac_email"
                        />
                      </div>
                    </div>
                    {
                      (state.dac.chairpersons.length > 0 || state.dac.members.length > 0)
                      && (
                        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                          <label id="lbl_dacMembers" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
                            DAC
                            Members
                          </label>
                          <div style={{ flexBasis: '66.67%' }}>
                            <DacUsers
                              dac={state.dac}
                              removeButton={true}
                              removeHandler={removeDacMember}
                            />
                          </div>
                        </div>
                      )
                    }

                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                      <label id="lbl_dacChair" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
                        Add
                        Chairperson(s)
                      </label>
                      <div style={{ flexBasis: '66.67%' }}>
                        <AsyncSelect
                          id="sel_dacChair"
                          isDisabled={false}
                          isMulti
                          loadOptions={(query, callback) => chairSearch(query, callback)}
                          onChange={option => onChairSearchChange(option)}
                          onInputChange={() => onSearchInputChanged()}
                          onMenuClose={() => onSearchMenuClosed()}
                          noOptionsMessage={() => 'Select a DUOS User...'}
                          value={state.chairsSelectedOptions}
                          classNamePrefix="select"
                          placeholder="Select a DUOS User..."
                          className="select-autocomplete"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                      <label id="lbl_dacMember" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
                        Add
                        Member(s)
                      </label>
                      <div style={state.searchInputChanged
                        ? {
                            paddingBottom: '10rem',
                            flexBasis: '66.67%',
                          }
                        : { flexBasis: '66.67%' }}
                      >
                        <AsyncSelect
                          id="sel_dacMember"
                          isDisabled={false}
                          isMulti={true}
                          loadOptions={(query, callback) => memberSearch(query, callback)}
                          onChange={option => onMemberSearchChange(option)}
                          onInputChange={() => onSearchInputChanged()}
                          onMenuClose={() => onSearchMenuClosed()}
                          noOptionsMessage={() => 'Select a DUOS User...'}
                          value={state.membersSelectedOptions}
                          classNamePrefix="select"
                          placeholder="Select a DUOS User..."
                          className="select-autocomplete"
                        />
                      </div>
                    </div>
                    <div className="inline-block" style={{ paddingBottom: '20px' }}>
                      <button
                        id="btn_save"
                        onClick={okHandler}
                        className="f-left btn-primary common-background"
                        data-cy="btn_save"
                      >
                        Save
                      </button>
                      <div style={{ marginLeft: '40px' }}>
                        <button
                          id="btn_cancel"
                          onClick={closeHandler}
                          className="f-left btn-secondary"
                          data-cy="btn_cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                  {
                    state.error.show && (
                      <div>
                        <Alert id="modal" type="danger" title={state.error.title} description={this.state.error.msg} />
                      </div>
                    )
                  }
                </div>
              </div>
              <div style={{ flexBasis: '50%', flexGrow: 0, flexShrink: 0 }}>
                <label id="lbl_daaCreation" className="control-label" style={{ flexBasis: '83.33%' }}>
                  Select a Data Access
                  Agreement (DAA) to govern access to your DAC&apos;s datasets
                </label>
                <ul role="menu" style={{ padding: '0px', textTransform: 'none', listStyle: 'none' }}>
                  <form>
                    <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                      <label style={{ fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                        <label id="lbl_daaCreation" className="control-label" style={{ marginTop: '0px' }}>
                          Use default
                          agreement
                        </label>
                        <br />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="radio"
                            name="daa"
                            checked={selectedDaa !== null && selectedDaa?.daaId === broadDaa?.daaId}
                            onChange={() => handleDaaChange(broadDaa.daaId)}
                            style={{ accentColor: '#00609f' }}
                            data-cy="daa_radio"
                          />
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                            <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
                              DUOS Uniform DAA
                            </div>
                            <div style={{ flexBasis: '25%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
                              <div style={{ marginLeft: '10px' }}>
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  href={DUOSUniformDataAccessAgreement}
                                  className="button button-white"
                                  style={{ padding: '10px 12px' }}
                                >
                                  <span className="glyphicon glyphicon-download-alt"></span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </li>
                    <hr />
                    <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                      <label style={{ fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                        <label id="lbl_daaCreation" className="control-label" style={{ marginTop: '0px' }}>
                          Use your own
                          agreement
                        </label>
                        <br />
                        {
                          matchingDaas.map((daa, index) => (
                            <DaaItem key={index} specificDaa={daa} />
                          ))
                        }
                        {uploadedDAAFile !== null
                          && (
                            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
                              <input
                                type="radio"
                                name="daa"
                                checked={uploadedDAAFile || selectedDaa.daaId === createdDaa.daaId}
                                onChange={createdDaa?.daaId ? () => handleDaaChange(createdDaa.daaId) : () => handleDaaChange(undefined)}
                                style={{ accentColor: '#00609f' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                                <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
                                  <div className="row" style={{ paddingLeft: '15px' }}>
                                    {daaFileData.name}
                                  </div>
                                  <div className="row" style={{ fontSize: '1rem', paddingLeft: '15px' }}>
                                    Uploaded on
                                    {' '}
                                    {new Date().toLocaleDateString()}
                                  </div>
                                </div>
                                <div style={{ flexBasis: '25%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
                                  <div style={{ marginLeft: '10px' }}>
                                    <a
                                      target="_blank"
                                      rel="noreferrer"
                                      download={uploadedDAAFile[0].name}
                                      href={URL.createObjectURL(uploadedDAAFile[0])}
                                      className="button button-white"
                                      style={{ padding: '10px 12px' }}
                                    >
                                      <span className="glyphicon glyphicon-download-alt"></span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '15px' }}>
                          <button
                            className="button button-white"
                            onClick={(event) => {
                              event.preventDefault()
                              setShowUploadModal(true)
                            }}
                            data-cy="daa_upload_button"
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <PublishIcon style={{ scale: '1.5' }} />
                              <div style={{ marginLeft: '10px' }}>
                                Upload file
                              </div>
                            </div>
                          </button>
                        </div>
                      </label>
                    </li>
                  </form>
                </ul>
              </div>
            </div>
            {showUploadModal && (
              <UploadDaaModal
                showModal={showUploadModal}
                setShowModal={setShowUploadModal}
                userRole={location?.state?.userRole}
                onCloseRequest={() => setShowUploadModal(false)}
                onAttachmentChange={handleAttachment}
              />
            )}
          </div>
        )
  )
}
