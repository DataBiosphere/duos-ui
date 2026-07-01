import { concat, filter, includes, isEmpty, map, union, matches as lodashMatches } from 'src/utils/NodashUtil'
import React, { useEffect, useRef, useState } from 'react'
import { User } from 'src/libs/ajax/User'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { ResearcherReview } from 'src/components/ResearcherReview'
import editUserIcon from 'src/images/icon_edit_user.png'
import { PageHeading } from 'src/components/PageHeading'
import { extractError } from 'src/utils/ErrorUtils'
import { useNavigate, useParams } from 'react-router-dom'
import ExternalProfile from 'src/pages/user_profile/ExternalProfile'
import { DuosUser } from 'src/types/model'

interface RoleRef {
  roleId: number
  name: string
}

const adminRole: RoleRef = { roleId: 4, name: USER_ROLES.admin }
const researcherRole: RoleRef = { roleId: 5, name: USER_ROLES.researcher }
const signingOfficialRole: RoleRef = { roleId: 7, name: USER_ROLES.signingOfficial }
const serviceAccount: RoleRef = { roleId: 10, name: USER_ROLES.serviceAccount }

interface AdminEditUserState {
  user: DuosUser | undefined
  displayName: string
  email: string
  displayNameValid: boolean
  updatedRoles: RoleRef[]
  emailPreference: boolean
  institutionName: string
}

export const AdminEditUser = () => {
  const params = useParams()
  const navigate = useNavigate()
  const userId = params.userId ? Number.parseInt(params.userId, 10) : undefined
  const [state, setState] = useState<AdminEditUserState>({
    user: undefined,
    displayName: '',
    email: '',
    displayNameValid: false,
    updatedRoles: [researcherRole],
    emailPreference: false,
    institutionName: '',
  })
  const [fetchingComplete, setFetchingComplete] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (userId === undefined) return
    const fetchData = async () => {
      try {
        const user = await User.getById(userId)
        const currentRoles: RoleRef[] = map(user.roles, ur => ({ roleId: ur.roleId, name: ur.name }))
        const updatedRoles = isEmpty(currentRoles) ? [researcherRole] : currentRoles
        setState(prev => ({
          ...prev,
          displayName: user.displayName,
          email: user.email,
          user,
          updatedRoles,
          emailPreference: user.emailPreference,
          institutionName: user.institution?.name ?? '',
        }))
        setFetchingComplete(true)
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve current user from server' })
      }
    }
    void fetchData()
  }, [userId])

  useEffect(() => {
    if (fetchingComplete && nameRef.current) {
      const valid = nameRef.current.validity.valid
      setState(prev => ({ ...prev, displayNameValid: valid }))
    }
  }, [fetchingComplete])

  const updateRolesIfDifferent = async (uid: number, updatedRoles: RoleRef[]) => {
    const user = await User.getById(uid)
    const currentRoleIds = map(user.roles, ur => ur.roleId)
    const updatedRoleIds = union([researcherRole.roleId], map(updatedRoles, r => r.roleId))

    await Promise.all(map(updatedRoleIds, async (roleId) => {
      if (!includes(currentRoleIds, roleId)) {
        await User.addRoleToUser(uid, roleId)
      }
    }))

    await Promise.all(map(currentRoleIds, async (roleId) => {
      if (!includes(updatedRoleIds, roleId) && roleId !== researcherRole.roleId) {
        await User.deleteRoleFromUser(uid, roleId)
      }
    }))
  }

  const OKHandler = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (!state.displayNameValid || !state.user) return

    const uid = state.user.userId
    const user = {
      displayName: state.displayName,
      emailPreference: state.emailPreference,
    }

    try {
      await User.update(user, uid)
      await updateRolesIfDifferent(uid, state.updatedRoles)
      navigate('/admin_manage_users')
    }
    catch (error) {
      const errorText = extractError(error)
      Notifications.showError({ text: errorText || 'Error: Failed to update user' })
    }
  }

  const emailPreferenceChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, emailPreference: !e.target.checked })
  }

  const roleStatusChanged = (e: React.ChangeEvent<HTMLInputElement>, role: RoleRef) => {
    const newRoles = e.target.checked
      ? concat(state.updatedRoles, role)
      : filter(state.updatedRoles, (r: RoleRef) => r.roleId !== role.roleId)
    setState({ ...state, updatedRoles: newRoles })
  }

  const userHasRole = (role: RoleRef): boolean => {
    return !isEmpty(filter(state.updatedRoles, lodashMatches(role)))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      displayName: e.target.value,
      displayNameValid: e.currentTarget.validity.valid,
    })
  }

  const { displayName, email, displayNameValid, institutionName } = state

  return (
    <div className="container container-wide">
      <div className="row no-margin">
        <div className="col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding">
          <PageHeading
            id="editUser"
            imgSrc={editUserIcon}
            iconSize="medium"
            color="common"
            title="Edit User"
            description="Edit a User in the system"
          />
        </div>
        <div className="col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding">
          <form className="form-horizontal css-form" name="userForm" encType="multipart/form-data">
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
                  disabled={true}
                />
              </div>
            </div>

            <div className="form-group">
              <label id="lbl_institution" htmlFor="txt_institution" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">Institution</label>
              <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
                <input
                  type="text"
                  name="institution"
                  id="txt_institution"
                  className="form-control col-lg-12 vote-input"
                  placeholder="e.g. Example Institute of Technology"
                  required={true}
                  value={institutionName}
                  disabled={true}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="chk_researcher" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">Roles</label>
              <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8 bold">
                <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
                  <div className="checkbox">
                    <input
                      type="checkbox"
                      id="chk_researcher"
                      checked={true}
                      readOnly={true}
                      className="checkbox-inline user-checkbox"
                    />
                    <label id="lbl_researcher" className="regular-checkbox rp-choice-questions" htmlFor="chk_researcher">Researcher</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <div
                className="col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4"
                style={{ paddingLeft: '30px' }}
              >
                <div className="checkbox">
                  <input
                    type="checkbox"
                    id="chk_signing_official"
                    checked={userHasRole(signingOfficialRole)}
                    className="checkbox-inline user-checkbox"
                    onChange={e => roleStatusChanged(e, signingOfficialRole)}
                  />
                  <label id="lbl_signing_official" className="regular-checkbox rp-choice-questions" htmlFor="chk_signing_official">Signing Official</label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4" style={{ paddingLeft: '30px' }}>
                <div className="checkbox">
                  <input
                    type="checkbox"
                    id="chk_admin"
                    checked={userHasRole(adminRole)}
                    className="checkbox-inline user-checkbox"
                    onChange={e => roleStatusChanged(e, adminRole)}
                  />
                  <label id="lbl_admin" className="regular-checkbox rp-choice-questions" htmlFor="chk_admin">Admin</label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4" style={{ paddingLeft: '30px' }}>
                <div className="checkbox">
                  <input
                    type="checkbox"
                    id="chk_service_account"
                    checked={userHasRole(serviceAccount)}
                    className="checkbox-inline user-checkbox"
                    onChange={e => roleStatusChanged(e, serviceAccount)}
                  />
                  <label id="lbl_service_account" className="regular-checkbox rp-choice-questions" htmlFor="chk_service_account">Service Account</label>
                </div>
              </div>
            </div>

            <div className="form-group">
              {userHasRole(adminRole) && (
                <div
                  className="col-lg-9 col-lg-offset-3 col-md-9 col-md-offset-3 col-sm-9 col-sm-offset-3 col-xs-8 col-xs-offset-4"
                  style={{ paddingLeft: '30px' }}
                >
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
              )}
              <div className="col-lg-12 col-xs-12 inline-block">
                <div style={{ marginLeft: '40px' }}>
                  <button
                    id="btn_back"
                    type="button"
                    onClick={() => navigate('/admin_manage_users')}
                    className="f-left btn-primary btn-back"
                  >
                    Back
                  </button>
                </div>
                <button
                  id="btn_save"
                  type="button"
                  onClick={OKHandler}
                  className="f-right btn-primary common-background"
                  disabled={!displayNameValid}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
        {state.user !== undefined && (
          <div style={{ marginTop: '50px' }} className="col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding">
            <ResearcherReview user={state.user} />
            <div style={{ marginTop: '20px' }}>
              <ExternalProfile userId={userId} readonly={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
