import { difference, filter, isEmpty, map, union } from 'lodash'
import React, { useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import type { MultiValue } from 'react-select'
import { DAC } from 'src/libs/ajax/DAC'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, PromiseSerial } from 'src/libs/utils'
import { Alert } from 'src/components/Alert'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DacUsers } from './DacUsers'
import editDACIcon from 'src/images/dac_icon.svg'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Spinner } from 'src/components/Spinner'
import PublishIcon from '@mui/icons-material/Publish'
import { Styles } from 'src/libs/theme'
import DUOSUniformDataAccessAgreement from 'src/assets/DUOS_Uniform_Data_Access_Agreement.pdf'
import { Storage } from 'src/libs/storage'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DocumentUpload, type FileRef } from 'src/components/forms/DocumentUpload'
import { EntityType, FileCategory, uploadDocument } from 'src/libs/ajax/FileStorageObject'
import type { DAAObject, DacObject, SimplifiedDuosUser } from 'src/types/model'

export const CHAIR = 'chair'
export const MEMBER = 'member'
const CHAIRPERSON = 'Chairperson'

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
  onChangeSelection: (daaId?: number) => void
}

type DacEditableField = 'name' | 'description' | 'email'
type RemovalListKey = 'chairIdsToRemove' | 'memberIdsToRemove'

function DaaItem({ specificDaa, selectedDaa, onChangeSelection }: Readonly<DaaItemProps>): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
      <input
        id={`radio_daa_${specificDaa.daaId}`}
        type="radio"
        name="daa"
        checked={selectedDaa?.daaId === specificDaa.daaId}
        onChange={() => onChangeSelection(specificDaa.daaId)}
        style={{ accentColor: '#00609f' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
        <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
          <label htmlFor={`radio_daa_${specificDaa.daaId}`} style={{ cursor: 'pointer', margin: 0 }}>
            <div className="row" style={{ paddingLeft: '15px' }}>
              {specificDaa.file.fileName}
            </div>
            <div className="row" style={{ fontSize: '1rem', paddingLeft: '15px' }}>
              Uploaded on
              {' '}
              {specificDaa?.updateDate ? new Date(specificDaa.updateDate).toLocaleDateString() : ''}
            </div>
          </label>
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
  const [daaFileData, setDaaFileData] = useState<File | null>(null)
  const [selectedDAAFiles, setSelectedDAAFiles] = useState<FileRef[] | null>(null)
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false)
  const [fetchedDac, setFetchedDac] = useState<DacObject | null>(null)
  const [broadDaa, setBroadDaa] = useState<DAAObject | null>(null)
  const [matchingDaas, setMatchingDaas] = useState<DAAObject[]>([])
  const dacText = dacId === undefined ? 'Create a new Data Access Committee in the system' : 'Manage My Data Access Committee'
  const user = Storage.getCurrentUser()
  const canUploadDAA = (user?.isAdmin ?? user?.roles?.some(role => String(role.dacId) === dacId && role.name === CHAIRPERSON)) ?? false

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (dacId) {
        try {
          const fetchedDac = await DAC.get(dacId) as DacObject
          setFetchedDac(fetchedDac)
          const daas = await DAA.getDaas() as DAAObject[]
          const broadDaa = daas.find(daa => daa.broadDaa) ?? null
          setBroadDaa(broadDaa)
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
      else {
        try {
          const daas = await DAA.getDaas() as DAAObject[]
          const broadDaa = daas.find(daa => daa.broadDaa) ?? null
          setBroadDaa(broadDaa)
        }
        catch {
          Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
        }
      }

      setIsLoading(false)
    }

    void fetchData()
  }, [dacId])

  const validateDaaForNewDac = (): boolean => {
    if (daaFileData === null && selectedDaa?.daaId !== broadDaa?.daaId) {
      handleErrors('Please select either the default agreement or upload your own agreement before saving.')
      return false
    }
    return true
  }

  const ensureDacExists = async (dacToProcess: DacObject): Promise<DacObject> => {
    if (dacId) {
      await DAC.update(dacToProcess.dacId, dacToProcess.name, dacToProcess.description, dacToProcess.email)
      return dacToProcess
    }

    if (!user?.isAdmin) {
      return dacToProcess
    }

    const newDac = await DAC.create(dacToProcess.name, dacToProcess.description, dacToProcess.email) as DacObject
    if (selectedDAAFiles !== null && selectedDaa === undefined) {
      for (const selectedDAAFile of selectedDAAFiles) {
        await uploadDocument(EntityType.DAC, String(newDac.dacId), selectedDAAFile.file, FileCategory.DATA_ACCESS_AGREEMENT)
      }
    }
    return newDac
  }

  const buildDacOperations = (dacForOps: DacObject): Array<() => Promise<unknown>> => {
    const ops0 = state.chairIdsToAdd.map(id => () => DAC.removeDacMember(dacForOps.dacId, id))
    const ops1 = state.memberIdsToRemove.map(id => () => DAC.removeDacMember(dacForOps.dacId, id))
    const ops2 = state.chairIdsToAdd.map(id => () => DAC.addDacChair(dacForOps.dacId, id))
    const ops3 = state.chairIdsToRemove.map(id => () => DAC.removeDacChair(dacForOps.dacId, id))
    const ops4 = state.memberIdsToAdd.map(id => () => DAC.addDacMember(dacForOps.dacId, id))
    const ops5 = newDaaId !== null && selectedDaa?.daaId !== undefined ? [() => DAA.addDaaToDac(newDaaId, dacForOps.dacId)] : []
    return ops0.concat(ops1, ops2, ops3, ops4, ops5)
  }

  const executeDacOperations = async (allOperations: Array<() => Promise<unknown>>): Promise<void> => {
    const responses = await PromiseSerial(allOperations)
    const errorCodes = filter(responses, r => JSON.stringify(r) !== '200' && JSON.stringify((r as { status?: number }).status) !== '201')
    if (isEmpty(errorCodes)) {
      closeHandler()
    }
    else {
      handleErrors('There was an error saving DAC information. Please verify that the DAC is correct by viewing the current information.')
    }
  }

  const okHandler = async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault()

    if (!state.dirtyFlag) {
      return
    }

    if (!dacId && !validateDaaForNewDac()) {
      return
    }

    const currentDac = await ensureDacExists(state.dac)
    const allOperations = buildDacOperations(currentDac)
    await executeDacOperations(allOperations)
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
      state.chairIdsToRemove) as number[]
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
      state.chairIdsToRemove) as number[]
    userSearch(invalidMembers, query, callback)
  }

  const userSearch = (invalidUserIds: number[], query: string, callback: (options: UserSelectOption[]) => void): void => {
    DAC.autocompleteUsers(query).then(
      (items: SimplifiedDuosUser[]) => {
        const filteredUsers = filter(items, (item) => {
          return !invalidUserIds.includes(item.userId)
        })
        const options = filteredUsers.map(function (item) {
          return {
            key: item.userId,
            value: item.userId,
            label: `${item.displayName} (${item.email})`,
            item: item,
          }
        })
        callback(options)
      },
      (error_: string) => {
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

  const toggleRemovalList = (key: RemovalListKey, userId: number): void => {
    setState((prev) => {
      const currentIds = prev[key]
      const nextIds = currentIds.includes(userId)
        ? difference(currentIds, [userId])
        : union(currentIds, [userId])

      return {
        ...prev,
        [key]: nextIds,
        dirtyFlag: true,
      }
    })
  }

  const removeDacMember = (_dacId: string | number, userId: number, role: DacRole): void => {
    switch (role) {
      case CHAIR:
        toggleRemovalList('chairIdsToRemove', userId)
        break
      case MEMBER:
        toggleRemovalList('memberIdsToRemove', userId)
        break
      default:
        break
    }
  }

  const handleUploadedDaaFiles = async (files: FileRef[]): Promise<void> => {
    setShowUploadModal(false)
    setSelectedDAAFiles(files)

    for (const file of files) {
      const uploadedFile = file?.file
      setDaaFileData(uploadedFile)
      if (dacId === undefined) {
        setSelectedDaa(undefined)
      }
      else {
        const createdDaa = await DAA.createDaa(uploadedFile, state.dac.dacId)
        setCreatedDaa(createdDaa.data)
      }
    }

    setState(prev => ({
      ...prev,
      dirtyFlag: true,
    }))
  }

  const handleDaaChange = (daaId?: number): void => {
    if (daaId === undefined) {
      setSelectedDaa(undefined)
      setState(prev => ({
        ...prev,
        dirtyFlag: true,
      }))
      return
    }

    const selectedFromList = matchingDaas.find(daa => daa.daaId === daaId)
    const selectedFromBroad = broadDaa?.daaId === daaId ? broadDaa : undefined
    setSelectedDaa(selectedFromList ?? selectedFromBroad ?? ({ daaId } as DAAObject))
    setNewDaaId(daaId)
    setState(prev => ({
      ...prev,
      dirtyFlag: true,
    }))
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
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                      <label htmlFor="txt_dacName" id="lbl_dacName" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
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
                        htmlFor="txt_dacDescription"
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
                      <label htmlFor="txt_dacEmail" id="lbl_dacEmail" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
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
                      ((state.dac.chairpersons?.length ?? 0) > 0 || (state.dac.members?.length ?? 0) > 0)
                      && (
                        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                          <label htmlFor="sel_dacChair" id="lbl_dacMembers" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
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
                      <label htmlFor="sel_dacChair" id="lbl_dacChair" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
                        Add
                        Chairperson(s)
                      </label>
                      <div style={{ flexBasis: '66.67%' }}>
                        <AsyncSelect<UserSelectOption, true>
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
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                      <label htmlFor="sel_dacMember" id="lbl_dacMember" style={{ flexBasis: '33.33%', paddingRight: '15px', fontSize: '16px' }}>
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
                        <AsyncSelect<UserSelectOption, true>
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
                        <Alert id="modal" type="danger" title={state.error.title ?? ''} description={state.error.msg ?? ''} />
                      </div>
                    )
                  }
                </div>
              </div>
              <div style={{ flexBasis: '50%', flexGrow: 0, flexShrink: 0 }}>
                <div id="lbl_daaCreation" className="control-label" style={{ flexBasis: '83.33%' }} aria-level={3}>
                  Select a Data Access Agreement (DAA) to govern access to your DAC&apos;s datasets
                </div>
                <ul style={{ padding: '0px', textTransform: 'none', listStyle: 'none' }}>
                  <form>
                    <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                      <div style={{ fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                        <label htmlFor="radio_daa_default" id="lbl_daaCreation" className="control-label" style={{ marginTop: '0px' }}>
                          Use default agreement
                        </label>
                        <br />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            id="radio_daa_default"
                            type="radio"
                            name="daa"
                            checked={selectedDaa !== null && selectedDaa?.daaId === broadDaa?.daaId}
                            onChange={() => handleDaaChange(broadDaa?.daaId)}
                            style={{ accentColor: '#00609f' }}
                            data-cy="daa_radio"
                          />
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                            <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
                              DUOS Uniform DAA
                            </div>
                            <div style={{ flexBasis: '25%', flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}>
                              <div style={{ marginLeft: '10px' }}>
                                <button
                                  onClick={() => {
                                    window.open(DUOSUniformDataAccessAgreement, '_blank')
                                  }}
                                  className="button button-white"
                                  style={{ padding: '10px 12px' }}
                                  title="Download DUOS Uniform Data Access Agreement"
                                  aria-label="Download DUOS Uniform Data Access Agreement"
                                >
                                  <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    <hr />
                    <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                      <div style={{ fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                        <div id="lbl_daaCreation" className="control-label" style={{ marginTop: '0' }} aria-level={4}>
                          Use your own agreement
                        </div>
                        {
                          matchingDaas.map(daa => (
                            <DaaItem key={daa.daaId} specificDaa={daa} selectedDaa={selectedDaa} onChangeSelection={handleDaaChange} />
                          ))
                        }
                        {daaFileData !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
                            <input
                              type="radio"
                              name="daa"
                              checked={selectedDaa?.daaId === createdDaa?.daaId}
                              onChange={() => handleDaaChange(createdDaa?.daaId)}
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
                                    download={daaFileData.name}
                                    href={URL.createObjectURL(daaFileData)}
                                    className="button button-white"
                                    style={{ padding: '10px 12px' }}
                                  >
                                    <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span>
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
                              setShowUploadModal(!showUploadModal)
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
                        {showUploadModal && (
                          <div style={{ marginTop: '15px' }}>
                            {dacId === undefined
                              ? (
                                  <DocumentUpload
                                    entity={EntityType.DAC}
                                    entityId={state.dac?.dacId?.toString() || 'new-dac'}
                                    isLiveUpload={false}
                                    categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
                                    onFilesReady={handleUploadedDaaFiles}
                                    styles={{ root: { p: 0, maxWidth: 'none', mx: 0 } }}
                                  />
                                )
                              : (
                                  <DocumentUpload
                                    entity={EntityType.DAC}
                                    entityId={dacId}
                                    isLiveUpload={true}
                                    categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
                                    readOnly={!canUploadDAA}
                                    styles={{ root: { p: 0, maxWidth: 'none', mx: 0 } }}
                                  />
                                )}
                          </div>
                        )}
                      </div>
                    </li>
                  </form>
                </ul>
              </div>
            </div>
          </div>
        )
  )
}
