import { difference, filter, isEmpty, map, union } from 'lodash'
import React, { useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import type { MultiValue } from 'react-select'
import { DAC } from 'src/libs/ajax/DAC'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, PromiseSerial } from 'src/libs/utils'
import { Alert } from 'src/components/Alert'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DacUsers } from './DacUsers'
import editDACIcon from 'src/images/dac_icon.svg'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Spinner } from 'src/components/Spinner'
import { Styles } from 'src/libs/theme'
import DUOSUniformDataAccessAgreement from 'src/assets/DUOS_Uniform_Data_Access_Agreement.pdf'
import PublishIcon from '@mui/icons-material/Publish'
import { UploadDaaModal } from 'src/components/modals/UploadDaaModal'
import { Storage } from 'src/libs/storage'
import TableHeaderSection from 'src/components/TableHeaderSection'
import type { DAAObject, DacObject, DuosUser, SimplifiedDuosUser } from 'src/types/model'

export const CHAIR = 'chair'
export const MEMBER = 'member'

type DacRole = typeof CHAIR | typeof MEMBER

interface ErrorState {
  show?: boolean
  title?: string
  msg?: string
}

interface UserSelectOption {
  key: number
  value: number
  label: string
  item: SimplifiedDuosUser
}

interface EditDacState {
  error: ErrorState
  dirtyFlag: boolean
  dac: DacObject
  chairsSelectedOptions: UserSelectOption[]
  chairIdsToAdd: number[]
  chairIdsToRemove: number[]
  membersSelectedOptions: UserSelectOption[]
  memberIdsToAdd: number[]
  memberIdsToRemove: number[]
  searchInputChanged: boolean
}

interface DaaItemProps {
  specificDaa: DAAObject
  selectedDaa: DAAObject | null | undefined
  onChangeSelection: (daaId: number) => void
}

type DacEditableField = 'name' | 'description' | 'email'

function DaaItem({ specificDaa, selectedDaa, onChangeSelection }: Readonly<DaaItemProps>): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
      <input
        type="radio"
        name="daa"
        checked={selectedDaa?.daaId === specificDaa.daaId}
        onChange={() => onChangeSelection(specificDaa.daaId)}
        style={{ accentColor: '#00609f' }}
        data-cy={`daa_option_${specificDaa.daaId}`}
        aria-label={`Use agreement ${specificDaa.file.fileName}`}
      />
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
        <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
          <div className="row" style={{ paddingLeft: '15px' }}>
            {specificDaa.file.fileName}
          </div>
          <div className="row" style={{ paddingLeft: '15px' }}>
            Uploaded on
            {' '}
            {specificDaa?.updateDate ? new Date(specificDaa.updateDate).toLocaleDateString() : ''}
          </div>
        </div>
        <div style={{ flexBasis: '25%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
          <div style={{ marginLeft: '10px' }}>
            <button
              onClick={async () => {
                await DAA.getDaaFileById(specificDaa.daaId, specificDaa.file.fileName)
              }}
              className="button button-white"
              style={{ padding: '10px 12px' }}
              title="Download file"
              aria-label={`Download ${specificDaa.file.fileName}`}
            >
              <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditDac(): React.JSX.Element {
  const params = useParams<{ dacId?: string }>()
  const dacId = params.dacId
  const navigate = useNavigate()
  const location = useLocation() as { state?: { userRole?: string } }
  const [state, setState] = useState<EditDacState>({
    error: {},
    dirtyFlag: false,
    dac: {},
    chairsSelectedOptions: [],
    chairIdsToAdd: [],
    chairIdsToRemove: [],
    membersSelectedOptions: [],
    memberIdsToAdd: [],
    memberIdsToRemove: [],
    searchInputChanged: false,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [newDaaId, setNewDaaId] = useState<number | null>(null)
  const [selectedDaa, setSelectedDaa] = useState<DAAObject | null | undefined>(null)
  const [createdDaa, setCreatedDaa] = useState<DAAObject | null>(null)
  const [uploadedDAAFile, setUploadedDAAFile] = useState<File[] | null>(null)
  const [daaFileData, setDaaFileData] = useState<File | null>(null)
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false)
  const [fetchedDac, setFetchedDac] = useState<DacObject | null>(null)
  const [broadDaa, setBroadDaa] = useState<DAAObject | null>(null)
  const [matchingDaas, setMatchingDaas] = useState<DAAObject[]>([])
  const dacText = dacId === undefined ? 'Create a new Data Access Committee in the system' : 'Manage My Data Access Committee'

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (dacId === undefined) {
        try {
          const daas = await DAA.getDaas() as DAAObject[]
          const broadDaa = daas.find(daa => daa.broadDaa)
          setBroadDaa(broadDaa ?? null)
        }
        catch {
          Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
        }
      }
      else {
        try {
          const fetchedDac = await DAC.get(dacId) as DacObject
          setFetchedDac(fetchedDac)
          const daas = await DAA.getDaas() as DAAObject[]
          const broadDaa = daas.find(daa => daa.broadDaa)
          setBroadDaa(broadDaa ?? null)
          setState(prev => ({ ...prev, dac: fetchedDac }))
          const matchingDaas = daas.filter(daa => daa.initialDacId === fetchedDac.dacId)
          setMatchingDaas(matchingDaas)
          const daa = fetchedDac?.associatedDaa ?? null
          setSelectedDaa(daa?.daaId ? daa : null)
        }
        catch {
          Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
        }
      }

      setIsLoading(false)
    }

    void fetchData()
  }, [dacId])

  const okHandler = async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault()
    const user = Storage.getCurrentUser() as Partial<DuosUser> | null
    let currentDac = state.dac

    if (!state.dirtyFlag) {
      return
    }

    if (dacId === undefined) {
      if (daaFileData === null && selectedDaa?.daaId !== broadDaa?.daaId) {
        handleErrors('Please select either the default agreement or upload your own agreement before saving.')
        return
      }

      if (!user?.isAdmin) {
        return
      }

      currentDac = await DAC.create(currentDac.name, currentDac.description, currentDac.email) as DacObject
      if (daaFileData !== null && selectedDaa === undefined) {
        const createdDaaResponse = await DAA.createDaa(daaFileData, currentDac.dacId)
        setCreatedDaa((createdDaaResponse as { data?: DAAObject })?.data ?? null)
      }
    }
    else {
      await DAC.update(currentDac.dacId, currentDac.name, currentDac.description, currentDac.email)
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
    const ops5 = newDaaId !== null && selectedDaa !== undefined && currentDac.dacId !== undefined
      ? [() => DAA.addDaaToDac(newDaaId, currentDac.dacId)]
      : []
    const allOperations = ops0.concat(ops1, ops2, ops3, ops4, ops5)
    const responses = await PromiseSerial(allOperations)
    const errorCodes = filter(
      responses,
      r => JSON.stringify(r) !== '200' && JSON.stringify((r as { status?: number })?.status) !== '201',
    )

    if (isEmpty(errorCodes)) {
      closeHandler()
    }
    else {
      handleErrors('There was an error saving DAC information. Please verify that the DAC is correct by viewing the current information.')
    }
  }

  const closeHandler = (): void => {
    navigate('/manage_dac')
  }

  const handleErrors = (message: string): void => {
    Notifications.showError({ text: message })
  }

  const chairSearch = (query: string, callback: (options: UserSelectOption[]) => void): void => {
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

  const memberSearch = (query: string, callback: (options: UserSelectOption[]) => void): void => {
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

  const userSearch = (invalidUserIds: number[], query: string, callback: (options: UserSelectOption[]) => void): void => {
    DAC.autocompleteUsers(query).then(
      (items: SimplifiedDuosUser[]) => {
        const filteredUsers = filter(items, (item) => {
          return !invalidUserIds.includes(item.userId)
        })
        const options = filteredUsers.map((item): UserSelectOption => {
          return {
            key: item.userId,
            value: item.userId,
            label: `${item.displayName} (${item.email})`,
            item,
          }
        })
        callback(options)
      },
      (error_: unknown) => {
        handleErrors(String(error_))
      })
  }

  const onChairSearchChange = (data: MultiValue<UserSelectOption>): void => {
    setState(prev => ({
      ...prev,
      chairIdsToAdd: map(data, 'item.userId') as number[],
      chairsSelectedOptions: [...data],
      dirtyFlag: true,
    }))
  }

  const onMemberSearchChange = (data: MultiValue<UserSelectOption>): void => {
    setState(prev => ({
      ...prev,
      memberIdsToAdd: map(data, 'item.userId') as number[],
      membersSelectedOptions: [...data],
      dirtyFlag: true,
    }))
  }

  const onSearchInputChanged = (): void => {
    setState(prev => ({
      ...prev,
      searchInputChanged: true,
    }))
  }

  const onSearchMenuClosed = (): void => {
    setState(prev => ({
      ...prev,
      searchInputChanged: false,
    }))
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const target = event.target
    const value = target.value
    const name = target.name as DacEditableField

    setState(prev => ({
      ...prev,
      dac: { ...prev.dac, [name]: value } as DacObject,
      dirtyFlag: true,
    }))
  }

  const removeDacMember = (_dacId: string | number, userId: number, role: DacRole): void => {
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

  const handleAttachment = async (attachment: File[]): Promise<void> => {
    const firstAttachment = attachment?.[0]
    if (!firstAttachment) {
      return
    }

    setUploadedDAAFile(attachment)
    setDaaFileData(firstAttachment)
    setState(prev => ({
      ...prev,
      dirtyFlag: true,
    }))

    if (dacId !== undefined && state.dac.dacId !== undefined) {
      const createdDaaResponse = await DAA.createDaa(firstAttachment, state.dac.dacId)
      const freshDaa = ((createdDaaResponse as { data?: DAAObject })?.data ?? null)
      setCreatedDaa(freshDaa)
      if (freshDaa?.daaId === undefined) {
        setSelectedDaa(undefined)
      }
      else {
        setSelectedDaa(freshDaa)
        setNewDaaId(null)
      }
    }
    else {
      setSelectedDaa(undefined)
      setNewDaaId(null)
    }

    setShowUploadModal(false)
  }

  const handleDaaChange = (daaId?: number): void => {
    if (daaId === undefined) {
      setSelectedDaa(undefined)
      setNewDaaId(null)
      setState(prev => ({
        ...prev,
        dirtyFlag: true,
      }))
    }
    else {
      const matchingDaa = matchingDaas.find(daa => daa.daaId === daaId)
      let fallbackDaa: DAAObject | undefined
      if (broadDaa?.daaId === daaId) {
        fallbackDaa = broadDaa
      }
      else if (createdDaa?.daaId === daaId) {
        fallbackDaa = createdDaa
      }
      setSelectedDaa(matchingDaa ?? fallbackDaa ?? ({ daaId } as DAAObject))
      setNewDaaId(createdDaa?.daaId === daaId ? null : daaId)
      setState(prev => ({
        ...prev,
        dirtyFlag: true,
      }))
    }
  }

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
                icon={{ src: editDACIcon }}
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
                    <div style={{ display: 'flex', marginBottom: '15px' }}>
                      <label
                        id="lbl_dacName"
                        htmlFor="txt_dacName"
                        style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
                        className="control-label common-color"
                      >
                        DAC Name
                      </label>
                      <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
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

                    <div style={{ display: 'flex', marginBottom: '15px' }}>
                      <label
                        id="lbl_dacDescription"
                        htmlFor="txt_dacDescription"
                        style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
                        className="control-label common-color"
                      >
                        DAC Description
                      </label>
                      <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
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

                    <div style={{ display: 'flex', marginBottom: '15px' }}>
                      <label
                        id="lbl_dacEmail"
                        htmlFor="txt_dacEmail"
                        style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
                        className="control-label common-color"
                      >
                        DAC Email
                      </label>
                      <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
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
                      ((state.dac.chairpersons?.length ?? 0) > 0 || (state.dac.members?.length ?? 0) > 0)
                      && (
                        <div style={{ display: 'flex', marginBottom: '15px' }}>
                          <div
                            id="lbl_dacMembers"
                            style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
                            className="control-label common-color"
                          >
                            DAC Members
                          </div>
                          <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
                            <DacUsers
                              dac={state.dac}
                              removeButton={true}
                              removeHandler={removeDacMember}
                            />
                          </div>
                        </div>
                      )
                    }

                    <div style={{ display: 'flex', marginBottom: '15px' }}>
                      <div
                        id="lbl_dacChair"
                        style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
                        className="control-label common-color"
                      >
                        Add Chairperson(s)
                      </div>
                      <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
                        <AsyncSelect
                          id="sel_dacChair"
                          isDisabled={false}
                          isMulti
                          loadOptions={(query, callback) => chairSearch(query, callback as (options: UserSelectOption[]) => void)}
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
                    <div style={{ display: 'flex', marginBottom: '15px' }}>
                      <div
                        id="lbl_dacMember"
                        style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
                        className="control-label common-color"
                      >
                        Add Member(s)
                      </div>
                      <div style={state.searchInputChanged
                        ? {
                            paddingBottom: '10rem',
                            flexBasis: '66.67%',
                            paddingLeft: '15px',
                          }
                        : { flexBasis: '66.67%', paddingLeft: '15px' }}
                      >
                        <AsyncSelect
                          id="sel_dacMember"
                          isDisabled={false}
                          isMulti={true}
                          loadOptions={(query, callback) => memberSearch(query, callback as (options: UserSelectOption[]) => void)}
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
                    <div style={{ paddingBottom: '20px', float: 'right' }}>
                      <button
                        id="btn_save"
                        onClick={okHandler}
                        className="f-left btn-primary common-background"
                        data-cy="btn_save"
                      >
                        Save
                      </button>
                      <button
                        id="btn_cancel"
                        onClick={closeHandler}
                        className="f-left btn-secondary"
                        data-cy="btn_cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                  {
                    state.error.show && (
                      <div>
                        <Alert id="modal" type="danger" title={state.error.title ?? ''} description={state.error.msg ?? ''} />
                      </div>
                    )
                  }
                </div>
              </div>
              <div style={{ flexBasis: '50%', flexGrow: 0, flexShrink: 0 }}>
                <div id="daa_agreement_section" className="control-label" style={{ flexBasis: '83.33%', marginTop: 0 }}>
                  Select a Data Access
                  Agreement (DAA) to govern access to your DAC&apos;s datasets
                </div>
                <ul style={{ padding: '0px', textTransform: 'none', listStyle: 'none' }}>
                  <form>
                    <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                      <fieldset style={{ border: 'none', padding: '0', margin: '0' }} aria-labelledby="default_daa_heading">
                        <div id="default_daa_heading" className="control-label" style={{ marginTop: 0 }}>
                          Use default agreement
                        </div>
                        <br />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            id="default_daa_radio"
                            type="radio"
                            name="daa"
                            checked={selectedDaa !== null && selectedDaa?.daaId === broadDaa?.daaId}
                            onChange={() => handleDaaChange(broadDaa?.daaId)}
                            style={{ accentColor: '#00609f' }}
                            data-cy="daa_radio"
                            aria-label="Use default DUOS Uniform Data Access Agreement"
                          />
                          <div
                            style={{ marginLeft: '10px', marginBottom: '0', fontWeight: 'normal' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                              <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0 }}>
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
                        </div>
                      </fieldset>
                    </li>
                    <hr />
                    <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                      <fieldset style={{ border: 'none', padding: '0', margin: '0' }} aria-labelledby="custom_daa_heading">
                        <div id="custom_daa_heading" className="control-label" style={{ marginTop: 0 }}>
                          Use your own agreement
                        </div>
                        <br />
                        {
                          matchingDaas.map(daa => (
                            <DaaItem key={daa.daaId} specificDaa={daa} selectedDaa={selectedDaa} onChangeSelection={handleDaaChange} />
                          ))
                        }
                        {uploadedDAAFile !== null
                          && (
                            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
                              <input
                                id="uploaded_daa_radio_input"
                                type="radio"
                                name="daa"
                                checked={selectedDaa === undefined || (createdDaa?.daaId !== undefined && selectedDaa?.daaId === createdDaa.daaId)}
                                onChange={createdDaa?.daaId ? () => handleDaaChange(createdDaa.daaId) : () => handleDaaChange()}
                                style={{ accentColor: '#00609f' }}
                                data-cy="uploaded_daa_radio"
                                aria-label={`Use uploaded agreement: ${daaFileData?.name ?? uploadedDAAFile?.[0]?.name ?? 'uploaded file'}`}
                              />
                              <div
                                style={{ marginLeft: '10px', marginBottom: '0', fontWeight: 'normal', flex: 1 }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                                  <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0 }}>
                                    <div className="row" style={{ paddingLeft: '15px' }} data-cy="uploaded_daa_name">
                                      {daaFileData?.name ?? uploadedDAAFile[0]?.name}
                                    </div>
                                    <div className="row" style={{ paddingLeft: '15px' }}>
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
                                        data-cy="uploaded_daa_download"
                                      >
                                        <span className="glyphicon glyphicon-download-alt"></span>
                                      </a>
                                    </div>
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
                      </fieldset>
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
