import React, {useEffect, useState} from 'react';
import {Institution} from 'src/types/model';
import backArrowIcon from 'src/images/back_arrow.svg';
import {Link} from 'react-router-dom';
import {Styles} from 'src/libs/theme';
import {History} from 'history';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {LabeledField} from 'src/pages/DatasetStatistics';
import {Button, Chip, TextField} from '@mui/material';
import {FormField, FormFieldTypes} from 'src/components/forms/forms';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const styles = {
    row: {
        display: 'flex',
        alignItems: 'flex-start'
    },
    baseStyle: {
        fontFamily: 'Montserrat',
        fontSize: '1.4rem',
        fontWeight: 400,
        display: 'flex',
        padding: '1rem 2%',
        justifyContent: 'space-between',
        alignItems: 'center',
        whiteSpace: 'pre-wrap',
        backgroundColor: 'white',
        border: '1px solid #DEDEDE',
        borderRadius: '4px',
        textOverflow: 'ellipsis',
        height: '4rem',
        marginTop: 5,
    },
    columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
        justifyContent: 'space-between',
        fontFamily: 'Montserrat',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        letterSpacing: '0.2px',
        backgroundColor: '#E2E8F4',
        border: 'none',
        textTransform: 'uppercase',
        lineHeight: '16px',
    }),
    containerOverride: {}
};

interface InstitutionDetailsProps {
    history: History,
    match: {
        params: {
            institutionId: number;
        }
    }
}

export const InstitutionDetails = (props: InstitutionDetailsProps) => {
    // const { history } = props;
    const { institutionId } = props.match.params;
    const [loading, setLoading] = useState(true);
    const [institution, setInstitution] = useState<Institution>();
    const [editMode, setEditMode] = useState(false);
    const [tempInstitution, setTempInstitution] = useState<Institution | undefined>(institution);
    const [tempDomain, setTempDomain] = useState<string>('');

    useEffect(() => {
        InstitutionAPI.getById(institutionId).then((resp) => {
            setInstitution(resp);
            setLoading(false);
        });
    }, [institutionId]);

    //todo: decide whether to use the put or the patch endpoint
    const updateInstitution = (updatedInstitution: Institution) => {
        // InstitutionAPI.patchInstitution(updatedInstitution).then((resp) => {
        //     setInstitution(resp);
        // });
        console.log('Updating institution:', updatedInstitution);
    }

    const handleEditToggle = () => {
        if (editMode) {
            // Save changes
            if (tempInstitution) {
                updateInstitution(tempInstitution);
            }
        } else {
            // Enter edit mode - create a copy of the institution data
            setTempInstitution({...institution} as Institution);
        }
        setEditMode(!editMode);
    }

    const handleCancelEdit = () => {
        // Exit edit mode without saving changes
        setEditMode(false);
        setTempInstitution(institution);
    }

    const handleNameChange = (value: string) => {
        if (tempInstitution) {
            setTempInstitution({...tempInstitution, name: value});
        }
    }

    const handleDomainDelete = (domainToDelete: string) => {
        if (tempInstitution) {
            const updatedDomains = tempInstitution.domains.filter(domain => domain !== domainToDelete);
            setTempInstitution({...tempInstitution, domains: updatedDomains});
        }
    }

    return !loading ? <div style={styles.row}>
        <div style={{paddingLeft: 40}}>
            <Link
                id='link_institutions'
                to='/admin_manage_institutions'
                className='navbar-brand'
                style={{height: 28, width: 28}}
            >
                <img id='back-arrow-icon' src={backArrowIcon} alt={'Back'} style={{height: 28, width: 28}}/>
            </Link>
        </div>
        <div style={{padding: '0 16px', display: 'flex', flexDirection: 'column', width: '100%', paddingRight: 40}}>
            <div style={{ fontSize: 20, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Back to institutions</span>
                <div>
                    {editMode && (
                        <Button
                            size={'large'}
                            variant="outlined"
                            color="error"
                            onClick={handleCancelEdit}
                            style={{ marginRight: '10px', fontSize: 14 }}
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
                    >
                        {editMode ? 'Save' : 'Edit'}
                    </Button>
                </div>
            </div>
            <LabeledField label={'Institution Name'} labelPlacement={'top'}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <FormField
                        type={FormFieldTypes.TEXT}
                        id='institution-name'
                        readOnly={!editMode}
                        defaultValue={editMode ? tempInstitution?.name : institution?.name}
                        onChange={(e) => editMode && handleNameChange(e.target.value)}
                        style={{
                            width: '25%', marginTop: '10px', minWidth: 300
                        }}
                    />
                </div>
            </LabeledField>
            <LabeledField label={'Domains'} labelPlacement={'top'}>
                {(editMode ? tempInstitution?.domains : institution?.domains)?.map((domain, idx) => (
                    <Chip
                        key={idx}
                        label={domain}
                        variant={'outlined'}
                        style={{marginRight: 5, marginTop: 5, fontSize: 12}}
                        onDelete={editMode ? () => handleDomainDelete(domain) : undefined}
                    />
                ))}
                {editMode && <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <TextField
                        variant='outlined'
                        value={tempDomain}
                        size="small"
                        InputProps={{
                            style: { fontSize: 14 }
                        }}
                        style={{ width: 250 }}
                        onChange={(e) => {
                            setTempDomain(e.target.value);
                        }}
                    />
                    <Button
                        // size={'small'}
                        variant="contained"
                        onClick={() => {
                            if (tempDomain && tempInstitution && !tempInstitution.domains.includes(tempDomain)) {
                                const updatedDomains = [...tempInstitution.domains, tempDomain];
                                setTempInstitution({...tempInstitution, domains: updatedDomains});
                                setTempDomain('');
                            }
                        }}
                        style={{ marginLeft: 10, fontSize: 14, width: 'auto' }}
                    >
                        Add
                    </Button>
                </div>}
            </LabeledField>
            <div style={{paddingTop: 20, marginTop: 20, borderTop: '1px solid black', width: '100%'}}>
                <div style={{ fontSize: 20, fontWeight: 600, paddingBottom: 10 }}>
                    Signing Officials
                </div>
                {(editMode ? tempInstitution?.signingOfficials : institution?.signingOfficials)?.map((so) => (
                    <div key={so.userId} style={{display: 'flex', alignItems: 'center', marginBottom: 10}}>
                        <TextField
                            label='Name'
                            disabled={!editMode}
                            value={so.displayName}
                            InputProps={{
                                style: { fontSize: 14 },
                                readOnly: !editMode,
                            }}
                            onChange={(e) => {
                                if (editMode && tempInstitution) {
                                    const updatedOfficials = [...tempInstitution.signingOfficials];
                                    const officialIndex = updatedOfficials.findIndex(o => o.userId === so.userId);
                                    updatedOfficials[officialIndex] = {...updatedOfficials[officialIndex], displayName: e.target.value};
                                    setTempInstitution({...tempInstitution, signingOfficials: updatedOfficials});
                                }
                            }}
                            variant='outlined'
                            style={{marginRight: 10}}
                        />
                        <TextField
                            label='Email'
                            disabled={!editMode}
                            value={so.email}
                            InputProps={{
                                style: { fontSize: 14 },
                                readOnly: !editMode,
                            }}
                            onChange={(e) => {
                                if (editMode && tempInstitution) {
                                    const updatedOfficials = [...tempInstitution.signingOfficials];
                                    const officialIndex = updatedOfficials.findIndex(o => o.userId === so.userId);
                                    updatedOfficials[officialIndex] = {...updatedOfficials[officialIndex], email: e.target.value};
                                    setTempInstitution({...tempInstitution, signingOfficials: updatedOfficials});
                                }
                            }}
                            variant='outlined'
                        />
                    </div>
                ))}
            </div>
        </div>
    </div> : <div>Loading</div>;
}
