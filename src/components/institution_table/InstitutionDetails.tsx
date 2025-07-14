import React, {useEffect, useState} from 'react';
import {Institution} from 'src/types/model';
import backArrowIcon from 'src/images/back_arrow.svg';
import {Link, useHistory, useLocation} from 'react-router-dom';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {Button, TextField} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import {AxiosError} from 'axios';
import {Notifications} from 'src/libs/utils';
import {Spinner} from 'src/components/Spinner';
import {extractConsentError} from 'src/utils/ErrorUtils';
import {InstitutionDomainEditor} from 'src/components/institution_table/components/InstitutionDomainEditor';
import {SigningOfficialsList} from 'src/components/institution_table/components/SigningOfficialsList';

interface InstitutionDetailsProps {
    match: {
        params: {
            institutionId?: number;
        }
    },
    editMode: EditMode;
}

interface InstitutionDetailsUpdate {
    name: string;
    domains: string[];
}

type EditMode = 'CREATE_NEW' | 'EDIT_EXISTING';

export const InstitutionDetails = (props: InstitutionDetailsProps) => {
    const { institutionId } = props.match.params;
    const editMode = props.editMode;
    const location = useLocation();
    const history = useHistory();
    const institutionList = location.state?.institutionList || [];
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [institution, setInstitution] = useState<Institution>();
    const [institutionUpdates, setInstitutionUpdates] = useState<InstitutionDetailsUpdate>({
        name: institution?.name || '',
        domains: institution?.domains ? [...institution.domains] : [],
    });

    console.log(institutionUpdates);

    useEffect( () => {
        const loadInstitution = async () => {
            try {
                const resp = await InstitutionAPI.getById(institutionId);
                setInstitution(resp);
            } catch (error) {
                const axiosError = error as AxiosError;
                const consentError = extractConsentError(axiosError);
                Notifications.showError({
                    text: `Failed to load institution details: ${consentError ? consentError.message : 'An unexpected error occurred'}`,
                });
            } finally {
                setLoading(false);
            }
        }

        if(institutionId && editMode === 'EDIT_EXISTING') {
            loadInstitution();
        } else {
            setLoading(false);
            setIsEditing(true);
        }
    }, [institutionId]);

    const updateInstitution = async (updatedInstitution: InstitutionDetailsUpdate) => {
        try {
            setSaving(true);
            const resp = await InstitutionAPI.patchInstitution(institutionId, updatedInstitution);
            // NB: we need to preserve signing officials in state on update since they're not returned by the patch endpoint
            setInstitution(prevInstitution => {
                if (!prevInstitution) return resp;
                return {
                    ...resp,
                    signingOfficials: prevInstitution.signingOfficials || []
                };
            });
            Notifications.showSuccess({ text: 'Institution updated successfully' });
        } catch (error) {
            const axiosError = error as AxiosError;
            const consentError = extractConsentError(axiosError);
            if(consentError && consentError.code === 409) {
                Notifications.showError({
                    text: 'One or more of the domains specified is already used by another institution. A domain can only be associated with one institution.'
                });
            } else {
                Notifications.showError({
                    text: `An error occurred when trying to update the institution: ${consentError ? consentError.message : 'no additional error available'}`,
                });
            }
        } finally {
            setSaving(false);
        }
    }

    const createNewInstitution = async (newInstitution: InstitutionDetailsUpdate) => {
        try {
            setSaving(true);
            const resp = await InstitutionAPI.postInstitution(newInstitution);
            setInstitution(resp);
            Notifications.showSuccess({ text: 'Institution created successfully' });
            setIsEditing(false);
            history.push(`/admin_manage_institutions/institutions/${resp.id}`);
        } catch (error) {
            const axiosError = error as AxiosError;
            const consentError = extractConsentError(axiosError);
            if(consentError && consentError.code === 409) {
                Notifications.showError({
                    text: 'One or more of the domains specified is already used by another institution. A domain can only be associated with one institution.'
                });
            } else {
                Notifications.showError({
                    text: `An error occurred when trying to create the institution: ${consentError ? consentError.message : 'no additional error available'}`,
                });
            }
        } finally {
            setSaving(false);
        }
    }

    const enterEditMode = () => {
        setInstitutionUpdates({
            name: institution?.name || '',
            domains: institution?.domains ? [...institution.domains] : [],
        });
        setIsEditing(true);
    };

    const saveChanges = async () => {
        if (institutionUpdates) {
            setSaving(true);
            if(editMode === 'EDIT_EXISTING') {
                await updateInstitution(institutionUpdates);
            } else if (editMode === 'CREATE_NEW') {
                await createNewInstitution(institutionUpdates);
            } else {
                console.error('Unknown edit mode: ', editMode);
            }
            setSaving(false);
            setIsEditing(false);
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            saveChanges();
        } else {
            enterEditMode();
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setInstitutionUpdates({
            name: institution?.name || '',
            domains: institution?.domains ? [...institution.domains] : [],
        });
    }

    const handleNameChange = (value: string) => {
        if (institutionUpdates) {
            setInstitutionUpdates({...institutionUpdates, name: value});
        }
    }

    const handleDomainsChange = (newDomains: string[]) => {
        if (institutionUpdates) {
            setInstitutionUpdates({...institutionUpdates, domains: newDomains});
        }
    }

    const getConfirmButtonText = () => {
        if(isEditing && editMode === 'CREATE_NEW') {
            return saving ? 'Creating...' : 'Create';
        }
        if(isEditing && editMode === 'EDIT_EXISTING') {
            return saving ? 'Saving...' : 'Save';
        }
        return 'Edit';
    };

    if(editMode === 'EDIT_EXISTING' && !institutionId) {
        return <div style={{padding: 20}}>Error: No institution selected.</div>;
    }

    return !loading ? <div style={{
        display: 'flex',
        alignItems: 'flex-start'
    }}>
        <div style={{paddingLeft: 40}}>
            <Link
                id='link_institutions'
                to='/admin_manage_institutions'
                className='navbar-brand'
                style={{height: 28, width: 28, paddingTop: '0.67rem'}}
            >
                <img id='back-arrow-icon' src={backArrowIcon} alt={'Back'} style={{height: 28, width: 28}}/>
            </Link>
        </div>
        <div style={{padding: '0 16px', display: 'flex', flexDirection: 'column', width: '100%', paddingRight: 40, paddingBottom: 40}}>
            <div style={{ fontSize: 20, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Back to institutions</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {saving && <Spinner />}
                    {isEditing && !saving && editMode === 'EDIT_EXISTING' && (
                        <Button
                            size={'large'}
                            variant="outlined"
                            color="error"
                            onClick={handleCancelEdit}
                            style={{ marginRight: '10px', fontSize: 14 }}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        size={'large'}
                        variant="contained"
                        color={'primary'}
                        onClick={handleEditToggle}
                        style={{fontSize: 14}}
                        startIcon={!isEditing && <EditIcon />}
                        disabled={saving}
                    >
                        {getConfirmButtonText()}
                    </Button>
                </div>
            </div>
            <div style={{paddingTop: 20}}>
                <div style={{fontWeight: 600, marginBottom: '0.5rem', fontSize: 18}}>Institution Name</div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <TextField
                        variant='outlined'
                        value={isEditing ? institutionUpdates?.name : institution?.name}
                        size="small"
                        placeholder={'Institution Name'}
                        disabled={!isEditing}
                        InputProps={{
                            style: {fontSize: 14}
                        }}
                        style={{width: 300}}
                        onChange={(e) => {
                            handleNameChange(e.target.value);
                        }}
                        sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: '#7b7b7b',
                            },
                        }}
                    />
                </div>
            </div>

            <InstitutionDomainEditor
                domains={isEditing ? institutionUpdates?.domains || [] : institution?.domains || []}
                isEditing={isEditing}
                onDomainsChange={handleDomainsChange}
                institutionList={institutionList}
            />

            <SigningOfficialsList signingOfficials={institution?.signingOfficials || []} />
        </div>
    </div> : <div>Loading...</div>;
}

