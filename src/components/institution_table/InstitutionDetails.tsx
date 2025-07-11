import React, {useEffect, useState} from 'react';
import {Institution} from 'src/types/model';
import backArrowIcon from 'src/images/back_arrow.svg';
import {Link} from 'react-router-dom';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {Button, TextField} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import {AxiosError} from 'axios';
import {Notifications} from 'src/libs/utils';
import {Spinner} from 'src/components/Spinner';
import {extractConsentError} from 'src/utils/ErrorUtils';
import {InstitutionDomainEditor} from 'src/components/institution_table/components/InstitutionDomainEditor';

interface InstitutionDetailsProps {
    match: {
        params: {
            institutionId: number;
        }
    }
}

interface InstitutionDetailsUpdate {
    name: string;
    domains: string[];
}

export const InstitutionDetails = (props: InstitutionDetailsProps) => {
    const { institutionId } = props.match.params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [institution, setInstitution] = useState<Institution>();
    const [editMode, setEditMode] = useState(false);
    const [institutionUpdates, setInstitutionUpdates] = useState<InstitutionDetailsUpdate | undefined>();

    useEffect(() => {
        InstitutionAPI.getById(institutionId).then((resp) => {
            setInstitution(resp);
            setLoading(false);
        });
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

    const handleEditToggle = async () => {
        if (editMode) {
            if (institutionUpdates) {
                await updateInstitution(institutionUpdates);
                setEditMode(false);
            }
        } else {
            setInstitutionUpdates({
                name: institution?.name || '',
                domains: institution?.domains ? [...institution.domains] : [],
            });
            setEditMode(true);
        }
    }

    const handleCancelEdit = () => {
        setEditMode(false);
        setInstitutionUpdates(undefined);
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
                    {editMode && !saving && (
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
                        color={editMode ? 'success' : 'primary'}
                        onClick={handleEditToggle}
                        style={{fontSize: 14}}
                        startIcon={!editMode && <EditIcon />}
                        disabled={saving}
                    >
                        {editMode ? (saving ? 'Saving...' : 'Save') : 'Edit'}
                    </Button>
                </div>
            </div>
            <div style={{paddingTop: 20}}>
                <div style={{fontWeight: 600, marginBottom: '0.5rem', fontSize: 18}}>Institution Name</div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <TextField
                        variant='outlined'
                        value={editMode ? institutionUpdates?.name : institution?.name}
                        size="small"
                        placeholder={'Institution Name'}
                        disabled={!editMode}
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
                domains={editMode ? institutionUpdates?.domains || [] : institution?.domains || []}
                editMode={editMode}
                onDomainsChange={handleDomainsChange}
            />

            <div style={{paddingTop: 20, marginTop: 20, borderTop: '1px solid', borderColor: '#e1e1e1', width: '100%'}}>
                <div style={{fontSize: 18, fontWeight: 600, paddingBottom: '1rem'}}>
                    Signing Officials
                </div>
                <div className={'italic'} style={{display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '2rem'}}>
                    <InfoIcon fontSize="small" color="info"/>
                    Signing Officials cannot be modified from this page
                </div>
                {(!institution?.signingOfficials || institution.signingOfficials.length === 0) && (
                    <div style={{marginBottom: 10}} className={'italic'}>This institution does not have any signing
                        officials</div>
                )}
                {institution?.signingOfficials?.map((so) => (
                    <div key={so.userId} style={{display: 'flex', alignItems: 'center', marginBottom: 10}}>
                        <TextField
                            label='Name'
                            disabled={true}
                            value={so.displayName}
                            InputProps={{
                                style: {fontSize: 14},
                                size: 'small',
                                readOnly: true,
                            }}
                            InputLabelProps={{
                                style: {fontSize: 14}
                            }}
                            variant='outlined'
                            style={{marginRight: 10, width: 300}}
                            sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: '#7b7b7b',
                                },
                            }}
                        />
                        <TextField
                            label='Email'
                            disabled={true}
                            value={so.email}
                            style={{width: 300}}
                            InputProps={{
                                style: {fontSize: 14},
                                size: 'small',
                                readOnly: true,
                            }}
                            InputLabelProps={{
                                style: {fontSize: 14}
                            }}
                            variant='outlined'
                            sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: '#7b7b7b',
                                },
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    </div> : <div>Loading</div>;
}

