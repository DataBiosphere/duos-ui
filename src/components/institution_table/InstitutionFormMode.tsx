// Represents the two possible modes that the InstitutionDetails editor can be in
// Either a user is creating a new institution or editing an existing one
export type InstitutionFormMode = 'CREATE_NEW' | 'EDIT_EXISTING'

export const FORM_MODES: {
  readonly createNew: InstitutionFormMode
  readonly editExisting: InstitutionFormMode
} = {
  createNew: 'CREATE_NEW',
  editExisting: 'EDIT_EXISTING',
}
