import React, { useEffect, useState } from 'react'
import AsyncSelect from 'react-select/async'
import type { MultiValue } from 'react-select'
import { DAC } from 'src/libs/ajax/DAC'
import { DAA } from 'src/libs/ajax/DAA'
import { Institution } from 'src/libs/ajax/Institution'
import { Notifications, PromiseSerial } from 'src/libs/utils'
import { Alert } from 'src/components/Alert'
import { Link, useNavigate, useParams } from 'react-router'
import { DacUsers } from './DacUsers'
import editDACIcon from 'src/images/dac_icon.svg'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Spinner } from 'src/components/Spinner'
import { Styles } from 'src/libs/theme'
import PublishIcon from '@mui/icons-material/Publish'
import { UploadDaaModal } from 'src/components/modals/UploadDaaModal'
import { CreateDacUserModal } from 'src/components/modals/CreateDacUserModal'
import { Storage } from 'src/libs/storage'
import TableHeaderSection from 'src/components/TableHeaderSection'
import type { DAAObject, DacObject, DuosUser, SimplifiedDuosUser } from 'src/types/model'
import { DaaTabs } from 'src/components/DaaTabs'
import { DacProfileSection } from './DacProfileSection'
import {
  getOwnedDaas,
  getSharedDaas,
  getDefaultDaaForDac,
  getDefaultTabForDac,
  sortDaasByCreationDate,
} from 'src/libs/daaHelpers'

export const CHAIR = 'chair'
export const MEMBER = 'member'

interface EditDacProps {
  dacId?: number
  onClose?: () => void
  hideHeader?: boolean
  profileMode?: boolean
}

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

type DacEditableField = 'name' | 'description' | 'email'

export default function EditDac({ dacId: dacIdProp, onClose, hideHeader = false, profileMode = false }: EditDacProps = {}): React.JSX.Element {
  const params = useParams<{ dacId?: string }>()
  const dacIdParam = dacIdProp === undefined ? params.dacId : String(dacIdProp)
  const dacId = dacIdParam === undefined ? undefined : Number.parseInt(dacIdParam, 10)
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
  const [isDaaOperationInProgress, setIsDaaOperationInProgress] = useState<boolean>(false)
  const [newDaaId, setNewDaaId] = useState<number | null>(null)
  const [selectedDaa, setSelectedDaa] = useState<DAAObject | null | undefined>(null)
  const [createdDaa, setCreatedDaa] = useState<DAAObject | null>(null)
  const [uploadedDAAFile, setUploadedDAAFile] = useState<File[] | null>(null)
  const [selectedUploadedFileName, setSelectedUploadedFileName] = useState<string | null>(null)
  const [daaFileData, setDaaFileData] = useState<File[] | null>(null)
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false)
  const [createUserTargetRole, setCreateUserTargetRole] = useState<'chair' | 'member'>('chair')
  const [allowedDomains, setAllowedDomains] = useState<string[] | null>(null)
  const [fetchedDac, setFetchedDac] = useState<DacObject | null>(null)
  const [ownedDaas, setOwnedDaas] = useState<DAAObject[]>([])
  const [sharedDaas, setSharedDaas] = useState<DAAObject[]>([])
  const [activeTab, setActiveTab] = useState<'owned' | 'shared'>('shared')
  const dacText = dacIdParam === undefined ? 'Create a new Data Access Committee in the system' : 'Manage My Data Access Committee'
  const user = Storage.getCurrentUser()
  const canUpload = (user?.isAdmin || user?.roles?.some(r => r.dacId === fetchedDac?.dacId && r.name === 'Chairperson')) ?? false

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (dacIdParam === undefined) {
        try {
          const daas = await DAA.getDaas()
          // For new DACs, set owned and shared based on all available DAAs
          // Owned is empty (no DAC created yet), shared is all non-owned DAAs
          const sortedDaas = sortDaasByCreationDate(daas)
          setOwnedDaas([])
          setSharedDaas(sortedDaas)
          setActiveTab('shared')
          setSelectedDaa(null)
        }
        catch {
          Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
        }
      }
      else {
        try {
          if (dacId === undefined) {
            Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
            setIsLoading(false)
            return
          }

          const fetchedDac = await DAC.get(dacId)
          setFetchedDac(fetchedDac)
          const daas = await DAA.getDaas()
          setState(prev => ({ ...prev, dac: fetchedDac }))

          // Calculate owned and shared DAAs
          const sortedDaas = sortDaasByCreationDate(daas)
          const ownedDaasForDac = getOwnedDaas(sortedDaas, fetchedDac.dacId ?? 0)
          const sharedDaasForDac = getSharedDaas(sortedDaas, fetchedDac.dacId ?? 0)

          setOwnedDaas(ownedDaasForDac)
          setSharedDaas(sharedDaasForDac)

          // Determine default tab and DAA
          const currentlyAssigned = fetchedDac?.associatedDaa ?? undefined
          const defaultTab = getDefaultTabForDac(fetchedDac.dacId ?? 0, sortedDaas, currentlyAssigned)
          const defaultDaa = getDefaultDaaForDac(fetchedDac.dacId ?? 0, sortedDaas, currentlyAssigned)

          setActiveTab(defaultTab)
          setSelectedDaa(defaultDaa)
        }
        catch {
          Notifications.showError({ text: 'Error: Unable to retrieve current DAC from server' })
        }
      }

      setIsLoading(false)
    }

    void fetchData()
  }, [dacId, dacIdParam])

  useEffect(() => {
    const loadAllowedDomains = async (): Promise<void> => {
      if (user?.isAdmin) {
        setAllowedDomains(null)
        return
      }
      if (user?.institutionId) {
        try {
          const institution = await Institution.getById(user.institutionId)
          setAllowedDomains(institution?.domains ?? [])
        }
        catch {
          setAllowedDomains([])
        }
      }
      else {
        setAllowedDomains([])
      }
    }
    void loadAllowedDomains()
  }, [user?.isAdmin, user?.institutionId])

  const saveErrorMessage = 'There was an error saving DAC information. Please verify that the DAC is correct by viewing the current information.'

  const validateNewDacDaaSelection = (): boolean => {
    const hasNoDaaSelected = (daaFileData === null || daaFileData.length === 0) && !selectedDaa
    if (hasNoDaaSelected) {
      handleErrors('Please select a data access agreement or upload your own data access agreement before saving.')
      return false
    }
    return true
  }

  const createDaasForNewDac = async (createdDacId: number): Promise<DAAObject | null> => {
    if (daaFileData === null || daaFileData.length === 0 || selectedDaa !== undefined) {
      return null
    }

    setIsDaaOperationInProgress(true)
    let lastCreatedDaa: DAAObject | null = null

    try {
      for (const file of daaFileData) {
        try {
          const createdDaaResponse = await DAA.createDaa(file, createdDacId)
          const freshDaa = (createdDaaResponse as { data?: DAAObject })?.data ?? null
          if (freshDaa) {
            lastCreatedDaa = freshDaa
          }
          else {
            Notifications.showError({ text: `Unable to create DAA for '${file.name}'.` })
          }
        }
        catch {
          Notifications.showError({ text: `Unable to create DAA for '${file.name}'.` })
        }
      }
    }
    finally {
      setIsDaaOperationInProgress(false)
    }

    setCreatedDaa(lastCreatedDaa)
    return lastCreatedDaa
  }

  const addInitialChairsToDac = async (createdDacId: number): Promise<void> => {
    if (state.chairIdsToAdd.length > 0) {
      await Promise.all(state.chairIdsToAdd.map(id => DAC.addDacChair(createdDacId, id)))
    }
  }

  const persistNewDac = async (
    user: Partial<DuosUser> | null,
    dacName: string,
    dacDescription: string,
    dacEmail: string,
  ): Promise<DacObject | null> => {
    if (!validateNewDacDaaSelection()) {
      return null
    }

    if (!user?.isAdmin) {
      return null
    }

    const createdDac = await DAC.create(dacName, dacDescription, dacEmail)
    const createdDacId = createdDac.dacId

    if (createdDacId === undefined) {
      handleErrors(saveErrorMessage)
      return null
    }

    // Add chairs FIRST so the current user has permission to create the DAA.
    // Chair/member operations are normally handled in buildSaveOperations, but for
    // new DAC creation the DAA must be uploaded after chairs are in place.
    await addInitialChairsToDac(createdDacId)

    // Create DAAs for all uploaded files now that chairs have been granted
    await createDaasForNewDac(createdDacId)

    return createdDac
  }

  const persistExistingDac = async (
    currentDac: DacObject,
    dacName: string,
    dacDescription: string,
    dacEmail: string,
  ): Promise<DacObject | null> => {
    const existingDacId = currentDac.dacId
    if (existingDacId === undefined) {
      handleErrors(saveErrorMessage)
      return null
    }

    await DAC.update(existingDacId, dacName, dacDescription, dacEmail)
    return currentDac
  }

  const persistDacChanges = async (
    user: Partial<DuosUser> | null,
    currentDac: DacObject,
    dacName: string,
    dacDescription: string,
    dacEmail: string,
  ): Promise<DacObject | null> => {
    if (dacIdParam === undefined) {
      return persistNewDac(user, dacName, dacDescription, dacEmail)
    }

    return persistExistingDac(currentDac, dacName, dacDescription, dacEmail)
  }

  const buildSaveOperations = (currentDacId: number, chairsAlreadyAdded = false): Array<() => Promise<number>> => {
    // Order here is important. Since users cannot have multiple roles in the
    // same DAC, we have to make sure we remove users before re-adding any
    // back in a different role.
    // Chairs are a special case since we cannot remove all chairs from a DAC
    // so we handle that case first.
    //
    // When chairsAlreadyAdded is true (new DAC creation), chair operations are
    // skipped here because they were already performed in persistDacChanges to
    // ensure the user has permission to upload the DAA.
    const demoteChairsFromMember: Array<() => Promise<number>> = chairsAlreadyAdded ? [] : state.chairIdsToAdd.map(id => () => DAC.removeDacMember(currentDacId, id))
    const removeMembers: Array<() => Promise<number>> = state.memberIdsToRemove.map(id => () => DAC.removeDacMember(currentDacId, id))
    const addChairs: Array<() => Promise<number>> = chairsAlreadyAdded ? [] : state.chairIdsToAdd.map(id => () => DAC.addDacChair(currentDacId, id))
    const removeChairs: Array<() => Promise<number>> = state.chairIdsToRemove.map(id => () => DAC.removeDacChair(currentDacId, id))
    const addMembers: Array<() => Promise<number>> = state.memberIdsToAdd.map(id => () => DAC.addDacMember(currentDacId, id))
    const assignDaa: Array<() => Promise<number>> = newDaaId !== null && selectedDaa !== undefined
      ? [() => DAA.addDaaToDac(newDaaId, currentDacId)]
      : []
    return [...demoteChairsFromMember, ...removeMembers, ...addChairs, ...removeChairs, ...addMembers, ...assignDaa]
  }

  const okHandler = async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault()
    if (!state.dirtyFlag) {
      return
    }

    const currentDac = state.dac
    const dacName = currentDac.name ?? ''
    const dacDescription = currentDac.description ?? ''
    const dacEmail = currentDac.email ?? ''

    const persistedDac = await persistDacChanges(user, currentDac, dacName, dacDescription, dacEmail)
    if (persistedDac === null) {
      return
    }

    const currentDacId = persistedDac.dacId
    if (currentDacId === undefined) {
      handleErrors(saveErrorMessage)
      return
    }

    const allOperations = buildSaveOperations(currentDacId, dacIdParam === undefined)
    const responses = await PromiseSerial(allOperations)
    const errorCodes = responses.filter(
      r => JSON.stringify(r) !== '200' && JSON.stringify((r as { status?: number })?.status) !== '201',
    )

    if (errorCodes.length === 0) {
      closeHandler()
    }
    else {
      handleErrors(saveErrorMessage)
    }
  }

  const closeHandler = (): void => {
    if (onClose) {
      onClose()
    }
    else {
      navigate('/manage_dac')
    }
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

    const allInvalidChairIds = [
      ...(state.dac.chairpersons?.map(c => c.userId) ?? []),
      ...(state.dac.members?.map(m => m.userId) ?? []),
      ...state.memberIdsToAdd,
    ]
    const invalidChairs = [...new Set(allInvalidChairIds)].filter(
      id => !state.memberIdsToRemove.includes(id) && !state.chairIdsToRemove.includes(id),
    )
    userSearch(invalidChairs, query, callback)
  }

  const memberSearch = (query: string, callback: (options: UserSelectOption[]) => void): void => {
    // A valid member is any user:
    //    * minus current members
    //    * minus current chairs (you shouldn't be both a chair and a member)
    //    * minus any new chairs selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    //    * plus any chairs that are slated for removal

    const allInvalidMemberIds = [
      ...(state.dac.members?.map(m => m.userId) ?? []),
      ...(state.dac.chairpersons?.map(c => c.userId) ?? []),
      ...state.chairIdsToAdd,
    ]
    const invalidMembers = [...new Set(allInvalidMemberIds)].filter(
      id => !state.memberIdsToRemove.includes(id) && !state.chairIdsToRemove.includes(id),
    )
    userSearch(invalidMembers, query, callback)
  }

  const userSearch = (invalidUserIds: number[], query: string, callback: (options: UserSelectOption[]) => void): void => {
    DAC.autocompleteUsers(query).then(
      (items: SimplifiedDuosUser[]) => {
        const filteredUsers = items.filter(item => !invalidUserIds.includes(item.userId))
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
      chairIdsToAdd: data.map(d => d.item.userId),
      chairsSelectedOptions: [...data],
      dirtyFlag: true,
    }))
  }

  const onMemberSearchChange = (data: MultiValue<UserSelectOption>): void => {
    setState(prev => ({
      ...prev,
      memberIdsToAdd: data.map(d => d.item.userId),
      membersSelectedOptions: [...data],
      dirtyFlag: true,
    }))
  }

  const onUserCreated = (newUser: DuosUser, role: 'chair' | 'member'): void => {
    const newOption: UserSelectOption = {
      key: newUser.userId,
      value: newUser.userId,
      label: `${newUser.displayName} (${newUser.email})`,
      item: {
        userId: newUser.userId,
        displayName: newUser.displayName,
        email: newUser.email,
      },
    }
    if (role === CHAIR) {
      setState(prev => ({
        ...prev,
        chairIdsToAdd: [...prev.chairIdsToAdd, newUser.userId],
        chairsSelectedOptions: [...prev.chairsSelectedOptions, newOption],
        dirtyFlag: true,
      }))
    }
    else {
      setState(prev => ({
        ...prev,
        memberIdsToAdd: [...prev.memberIdsToAdd, newUser.userId],
        membersSelectedOptions: [...prev.membersSelectedOptions, newOption],
        dirtyFlag: true,
      }))
    }
    setShowCreateUserModal(false)
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
    const name = target.name

    // Validate that name is a valid DacEditableField before updating
    const validFields: ReadonlyArray<DacEditableField> = ['name', 'description', 'email']
    if (!validFields.includes(name as DacEditableField)) {
      return
    }

    setState((prev) => {
      const updatedDac: DacObject = {
        ...prev.dac,
        [name]: value,
      }
      return {
        ...prev,
        dac: updatedDac,
        dirtyFlag: true,
      }
    })
  }

  const toggleRemovalUserId = (key: 'chairIdsToRemove' | 'memberIdsToRemove', userId: number): void => {
    setState((prev) => {
      const ids = prev[key]
      const nextIds = ids.includes(userId)
        ? ids.filter(id => id !== userId)
        : [...new Set([...ids, userId])]
      return {
        ...prev,
        [key]: nextIds,
        dirtyFlag: true,
      }
    })
  }

  const removeDacMember = (_dacId: number | undefined, userId: number, role: string): void => {
    switch (role) {
      case CHAIR:
        toggleRemovalUserId('chairIdsToRemove', userId)
        break
      case MEMBER:
        toggleRemovalUserId('memberIdsToRemove', userId)
        break
      default:
        break
    }
  }

  const createDaasForExistingDac = async (attachment: File[], dacIdToUse: number): Promise<{ newDaas: DAAObject[], lastCreatedDaa: DAAObject | null }> => {
    const newDaas: DAAObject[] = []
    let lastCreatedDaa: DAAObject | null = null

    for (const file of attachment) {
      try {
        const createdDaaResponse = await DAA.createDaa(file, dacIdToUse)
        const freshDaa = (createdDaaResponse as { data?: DAAObject })?.data ?? null
        if (freshDaa) {
          newDaas.push(freshDaa)
          lastCreatedDaa = freshDaa
        }
        else {
          Notifications.showError({ text: `Unable to create DAA for '${file.name}'.` })
        }
      }
      catch {
        Notifications.showError({ text: `Unable to create DAA for '${file.name}'.` })
      }
    }

    return { newDaas, lastCreatedDaa }
  }

  const delay = async (ms: number): Promise<void> => {
    await new Promise(resolve => globalThis.setTimeout(resolve, ms))
  }

  const mergeDaasById = (baseDaas: DAAObject[], additionalDaas: DAAObject[]): DAAObject[] => {
    const daaById = new Map<number, DAAObject>()

    for (const daa of baseDaas) {
      if (daa.daaId !== undefined) {
        daaById.set(daa.daaId, daa)
      }
    }

    for (const daa of additionalDaas) {
      if (daa.daaId !== undefined) {
        daaById.set(daa.daaId, daa)
      }
    }

    return Array.from(daaById.values())
  }

  const refreshMatchingDaas = async (currentDacId: number, expectedDaaIds: number[]): Promise<DAAObject[]> => {
    const maxAttempts = 3

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const daas = await DAA.getDaas()
      const refreshedMatchingDaas = daas.filter(daa => daa.initialDacId === currentDacId)
      const allExpectedPresent = expectedDaaIds.every(id => refreshedMatchingDaas.some(daa => daa.daaId === id))

      if (allExpectedPresent || attempt === maxAttempts) {
        return refreshedMatchingDaas
      }

      await delay(attempt * 250)
    }

    return []
  }

  const handleExistingDacAttachment = async (attachment: File[]): Promise<void> => {
    setIsDaaOperationInProgress(true)

    try {
      const dacIdToUse = state.dac.dacId
      if (dacIdToUse === undefined) {
        return
      }

      const { newDaas, lastCreatedDaa } = await createDaasForExistingDac(attachment, dacIdToUse)
      const expectedDaaIds = newDaas
        .map(daa => daa.daaId)
        .filter((id): id is number => id !== undefined)

      let displayedDaas = newDaas
      try {
        const refreshedMatchingDaas = await refreshMatchingDaas(dacIdToUse, expectedDaaIds)
        displayedDaas = mergeDaasById(refreshedMatchingDaas, newDaas)
      }
      catch {
        // Preserve newly uploaded DAAs in the UI if refresh fails.
        Notifications.showError({ text: 'Unable to refresh DAA list after upload. Showing latest uploaded agreements.' })
      }

      // Update both the old matchingDaas and the new ownedDaas state
      setOwnedDaas(displayedDaas)

      // Refresh shared DAAs in case there were changes
      try {
        const allDaas = await DAA.getDaas()
        const sortedSharedDaas = sortDaasByCreationDate(
          getSharedDaas(allDaas, dacIdToUse),
        )
        setSharedDaas(sortedSharedDaas)
      }
      catch {
        // Continue with existing shared DAAs if refresh fails
      }

      const selectedCreatedDaa = lastCreatedDaa?.daaId === undefined
        ? lastCreatedDaa
        : displayedDaas.find(daa => daa.daaId === lastCreatedDaa.daaId) ?? lastCreatedDaa

      setCreatedDaa(selectedCreatedDaa ?? null)

      // Clear pending-upload state since DAAs are now in matchingDaas
      setUploadedDAAFile(null)
      setDaaFileData(null)

      // Update selected DAA based on creation success
      if (selectedCreatedDaa?.daaId === undefined) {
        setSelectedDaa(undefined)
      }
      else {
        setSelectedDaa(selectedCreatedDaa)
        setNewDaaId(null)
        // Make sure we're on the owned tab to see the newly created DAA
        setActiveTab('owned')
      }
    }
    finally {
      setIsDaaOperationInProgress(false)
    }
  }

  const handleNewDacAttachment = (attachment: File[]): void => {
    // New DAC: store all files; they will be created after the DAC is persisted
    setUploadedDAAFile(attachment)
    setDaaFileData(attachment)
    setSelectedDaa(undefined)
    setSelectedUploadedFileName(attachment[0]?.name ?? null)
    setNewDaaId(null)
  }

  const handleAttachment = async (attachment: File[]): Promise<void> => {
    if (!attachment || attachment.length === 0) {
      return
    }

    setState(prev => ({
      ...prev,
      dirtyFlag: true,
    }))

    const isExistingDac = dacId !== undefined && state.dac.dacId !== undefined

    if (isExistingDac) {
      await handleExistingDacAttachment(attachment)
    }
    else {
      handleNewDacAttachment(attachment)
    }

    setShowUploadModal(false)
  }

  const handleDaaChange = (daa: DAAObject): void => {
    setSelectedDaa(daa)
    setSelectedUploadedFileName(null)
    // Only update newDaaId if this is not a newly created DAA being selected
    if (daa.daaId === createdDaa?.daaId) {
      setNewDaaId(null)
    }
    else {
      setNewDaaId(daa.daaId)
    }
    setState(prev => ({
      ...prev,
      dirtyFlag: true,
    }))
  }

  const handleUploadedFileSelection = (fileName: string): void => {
    setSelectedDaa(undefined)
    setSelectedUploadedFileName(fileName)
    setNewDaaId(null)
    setState(prev => ({
      ...prev,
      dirtyFlag: true,
    }))
  }

  const errorAlertJSX = state.error.show
    ? (
        <div>
          <Alert id="modal" type="danger" title={state.error.title ?? ''} description={state.error.msg ?? ''} />
        </div>
      )
    : null

  const dacMembersJSX = ((state.dac.chairpersons?.length ?? 0) > 0 || (state.dac.members?.length ?? 0) > 0)
    ? (
        <div style={{ display: 'flex', marginBottom: '15px' }}>
          <div
            id="lbl_dacMembers"
            style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
            className="control-label common-color"
          >
            DAC Members
          </div>
          <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
            <DacUsers dac={state.dac} removeButton={true} removeHandler={removeDacMember} />
          </div>
        </div>
      )
    : null

  const chairSelectJSX = (
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
        <button
          className="btn btn-link"
          style={{ paddingLeft: 0, fontSize: '0.9em' }}
          data-cy="btn_create_chair"
          onClick={(e) => {
            e.preventDefault()
            setCreateUserTargetRole('chair')
            setShowCreateUserModal(true)
          }}
        >
          + Create new user as Chairperson
        </button>
      </div>
    </div>
  )

  const memberSelectJSX = (
    <div style={{ display: 'flex', marginBottom: '15px' }}>
      <div
        id="lbl_dacMember"
        style={{ flexBasis: '33.33%', paddingRight: '15px', marginTop: 0 }}
        className="control-label common-color"
      >
        Add Member(s)
      </div>
      <div style={state.searchInputChanged
        ? { paddingBottom: '10rem', flexBasis: '66.67%', paddingLeft: '15px' }
        : { flexBasis: '66.67%', paddingLeft: '15px' }}
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
        <button
          className="btn btn-link"
          style={{ paddingLeft: 0, fontSize: '0.9em' }}
          data-cy="btn_create_member"
          onClick={(e) => {
            e.preventDefault()
            setCreateUserTargetRole('member')
            setShowCreateUserModal(true)
          }}
        >
          + Create new user as Member
        </button>
      </div>
    </div>
  )

  const saveButtonsJSX = (
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
  )

  const basicFieldsJSX = (
    <>
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
    </>
  )

  const daaContentJSX = (
    <>
      <div style={{ marginTop: '20px' }}>
        <DaaTabs
          ownedDaas={ownedDaas}
          sharedDaas={sharedDaas}
          selectedDaa={selectedDaa}
          onSelectDaa={handleDaaChange}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isLoading={isDaaOperationInProgress}
        />
      </div>
      {uploadedDAAFile !== null && uploadedDAAFile.length > 0
        && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '15px', marginTop: '20px' }}>
            <div className="control-label" style={{ marginTop: 0 }}>
              Pending Upload
            </div>
            {uploadedDAAFile.map((file, idx) => (
              <div key={`${file.name}-${idx}`} style={{ display: 'flex', alignItems: 'flex-start', marginTop: '5px' }}>
                <input
                  type="radio"
                  name="daa"
                  checked={selectedDaa === undefined && selectedUploadedFileName === file.name}
                  onChange={() => handleUploadedFileSelection(file.name)}
                  style={{ accentColor: '#00609f', marginTop: '8px' }}
                  data-cy={idx === 0 ? 'uploaded_daa_radio' : undefined}
                  aria-label={`Use uploaded agreement ${file.name}`}
                />
                <div style={{ marginLeft: '10px', marginBottom: '0', fontWeight: 'normal', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                    <div style={{ flexBasis: '75%', flexGrow: 0, flexShrink: 0 }}>
                      <div className="row" style={{ paddingLeft: '15px' }} data-cy={idx === 0 ? 'uploaded_daa_name' : undefined}>
                        {file.name}
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
                          download={file.name}
                          href={URL.createObjectURL(file)}
                          className="button button-white"
                          style={{ padding: '10px 12px' }}
                          data-cy={idx === 0 ? 'uploaded_daa_download' : undefined}
                        >
                          <span className="glyphicon glyphicon-download-alt"></span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
    </>
  )

  const profileSaveButtons = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingBottom: '20px', marginTop: '1rem' }}>
      <button onClick={okHandler} className="f-left btn-primary common-background">Save</button>
      <button onClick={closeHandler} className="f-left btn-secondary">Cancel</button>
    </div>
  )

  const formContent = profileMode
    ? (
        <>
          <DacProfileSection title="DAC Membership">
            <div className="form-horizontal css-form" style={{ maxWidth: '1200px' }}>
              {dacMembersJSX}
              {chairSelectJSX}
              {memberSelectJSX}
            </div>
            {profileSaveButtons}
          </DacProfileSection>
          <DacProfileSection title="DAC Info">
            <form
              className="form-horizontal css-form"
              name="dacForm"
              noValidate
              encType="multipart/form-data"
              style={{ maxWidth: '1200px' }}
            >
              {basicFieldsJSX}
            </form>
            {errorAlertJSX}
            {profileSaveButtons}
          </DacProfileSection>
          <DacProfileSection title="Select a Data Access Agreement">
            {daaContentJSX}
          </DacProfileSection>
        </>
      )
    : (
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
                {basicFieldsJSX}
                {dacMembersJSX}
                {chairSelectJSX}
                {memberSelectJSX}
                {saveButtonsJSX}
              </form>
              {errorAlertJSX}
            </div>
          </div>
          <div style={{ flexBasis: '50%', flexGrow: 0, flexShrink: 0 }}>
            <div id="daa_agreement_section" className="control-label" style={{ flexBasis: '83.33%', marginTop: 0 }}>
              Select a Data Access
              Agreement (DAA) to govern access to your DAC&apos;s datasets
            </div>
            {daaContentJSX}
          </div>
        </div>
      )

  return (
    (isLoading || isDaaOperationInProgress)
      ? <Spinner />
      : (
          <div style={hideHeader ? {} : Styles.PAGE}>
            {!hideHeader && (
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
                  description={dacIdParam === undefined ? 'Create DAC' : fetchedDac?.name}
                />
              </div>
            )}
            {formContent}
            {showCreateUserModal && (
              <CreateDacUserModal
                showModal={showCreateUserModal}
                targetRole={createUserTargetRole}
                allowedDomains={allowedDomains}
                onUserCreated={onUserCreated}
                onCloseRequest={() => setShowCreateUserModal(false)}
              />
            )}
            {showUploadModal && (
              <UploadDaaModal
                showModal={showUploadModal}
                dacId={dacIdParam ?? 'new'}
                isLiveUpload={false}
                isReadOnly={!canUpload}
                onCloseRequest={() => setShowUploadModal(false)}
                onAttachmentChange={handleAttachment}
              />
            )}
          </div>
        )
  )
}
