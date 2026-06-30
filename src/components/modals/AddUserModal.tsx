import { concat, filter, isEmpty, matches } from 'src/utils/NodashUtil'
import React, { Fragment, useState, useRef, useEffect } from 'react'
import { User } from 'src/libs/ajax/User'
import { USER_ROLES } from 'src/libs/utils'
import { UserRole } from 'src/types/model'
import { Alert } from 'src/components/Alert'
import { BaseModal } from 'src/components/BaseModal'
import addUserIcon from 'src/images/icon_add_user.png'

type Role = Pick<UserRole, 'roleId' | 'name'>

const adminRole: Role = { roleId: 4, name: USER_ROLES.admin }
const researcherRole: Role = { roleId: 5, name: USER_ROLES.researcher }

interface AddUserModalState {
  displayName: string
  email: string
  displayNameValid: boolean
  emailValid: boolean
  invalidForm: boolean
  submitted: boolean
  alerts: { type: string, title: string, msg: string }[]
  updatedRoles: Role[]
  emailPreference: boolean
}

interface AddUserModalProps {
  showModal: boolean
  onOKRequest: (source: string) => void
  onCloseRequest: (source: string) => void
  onAfterOpen: (source: string) => void
}

export const AddUserModal = ({ showModal, onOKRequest, onCloseRequest, onAfterOpen }: Readonly<AddUserModalProps>) => {
  const [state, setState] = useState<AddUserModalState>({
    displayName: '',
    email: '',
    displayNameValid: false,
    emailValid: false,
    invalidForm: true,
    submitted: false,
    alerts: [],
    updatedRoles: [researcherRole],
    emailPreference: false,
  })

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showModal) return
    const r1 = nameRef.current
    const r2 = emailRef.current
    if (r1 && r2) {
      setState(prev => ({
        ...prev,
        displayNameValid: r1.validity.valid,
        emailValid: r2.validity.valid,
      }))
    }
  }, [showModal])

  const OKHandler = async (event?: React.SyntheticEvent) => {
    event?.persist()
    const validForm = state.displayNameValid && state.emailValid
    setState({ ...state, submitted: true })
    if (!validForm) return

    const user = {
      displayName: state.displayName,
      emailPreference: state.emailPreference,
      roles: state.updatedRoles as UserRole[],
      email: state.email,
    }

    const createUserRequest = async (u: typeof user) => {
      try {
        return await User.create(u)
      }
      catch {
        return false
      }
    }

    const createUser = await createUserRequest(user)

    setState({ ...state, submitted: true, emailValid: !!createUser })
    event?.preventDefault()

    if (createUser) {
      onOKRequest('addUser')
    }
  }

  const closeHandler = () => {
    onCloseRequest('addUser')
  }

  const afterOpenHandler = () => {
    onAfterOpen('addUser')
  }

  const emailPreferenceChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkState = e.target.checked
    setState({
      ...state,
      emailPreference: !checkState,
    })
  }

  const adminChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkState = e.target.checked
    let newRoles: Role[]
    if (checkState) {
      newRoles = concat(state.updatedRoles, adminRole)
    }
    else {
      newRoles = filter(state.updatedRoles, r => r.roleId !== adminRole.roleId)
    }
    setState({
      ...state,
      updatedRoles: newRoles,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name
    const validName = name + 'Valid'
    setState({
      ...state,
      [name]: e.target.value,
      [validName]: e.currentTarget.validity.valid,
    })
  }

  const formChange = () => {
    setState(prev => ({
      ...prev,
      invalidForm: prev.displayNameValid && prev.emailValid,
    }))
  }

  const isAdmin = () => {
    const admins = filter(state.updatedRoles, matches(adminRole))
    return !isEmpty(admins)
  }

  const { displayName, email, displayNameValid, emailValid } = state
  const validForm = displayNameValid && emailValid

  return (
    <BaseModal
      id="addUserModal"
      showModal={showModal}
      disableOkBtn={!validForm}
      onRequestClose={closeHandler}
      afterOpen={afterOpenHandler}
      imgSrc={addUserIcon}
      color="common"
      title="Add User"
      description="Catalog a new User in the system"
      action={{ label: 'Add', handler: OKHandler }}
    >
      <form className="form-horizontal css-form" name="userForm" encType="multipart/form-data" onChange={formChange}>
        <div className="form-group first-form-group">
          <label id="lbl_name" htmlFor="txt_name" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">Name</label>
          <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
            <input
              type="text"
              name="displayName"
              id="txt_name"
              className="form-control col-lg-12 vote-input"
              placeholder="User name"
              required={true}
              value={displayName}
              autoFocus={true}
              onChange={handleChange}
              ref={nameRef}
            />
          </div>
        </div>

        <div className="form-group">
          <label id="lbl_email" htmlFor="txt_email" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">Google account id</label>
          <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
            <input
              type="email"
              name="email"
              id="txt_email"
              className="form-control col-lg-12 vote-input"
              placeholder="e.g. username@broadinstitute.org"
              required={true}
              value={email}
              onChange={handleChange}
              ref={emailRef}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="chk_admin" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">Role</label>
          <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8 bold">
            <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
              <div className="checkbox">
                <input
                  type="checkbox"
                  id="chk_admin"
                  checked={isAdmin()}
                  className="checkbox-inline user-checkbox"
                  onChange={adminChanged}
                />
                <label id="lbl_admin" className="regular-checkbox rp-choice-questions" htmlFor="chk_admin">Admin</label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          {
            isAdmin() && (
              <div className="col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4" style={{ paddingLeft: '30px' }}>
                <div className="checkbox">
                  <input
                    id="chk_emailPreference"
                    type="checkbox"
                    className="checkbox-inline user-checkbox"
                    checked={!state.emailPreference}
                    onChange={emailPreferenceChanged}
                  />
                  <label htmlFor="chk_emailPreference" className="regular-checkbox rp-choice-questions bold">Disable Admin email notifications</label>
                </div>
              </div>
            )
          }
        </div>
      </form>
      {
        !state.emailValid && state.submitted && (
          <div>
            <Alert
              id="emailUsed"
              type="danger"
              title="Conflicts to resolve!"
              description="There is a user already registered with this google account."
            />
          </div>
        )
      }
      {
        state.alerts.length > 0 && (
          <div>
            {state.alerts.map((alertItem, ix) => (
              <Fragment key={'alert_' + ix}>
                <Alert id={'modal_' + ix} type={alertItem.type} title={alertItem.title} description={alertItem.msg} />
              </Fragment>
            ))}
          </div>
        )
      }
    </BaseModal>
  )
}
