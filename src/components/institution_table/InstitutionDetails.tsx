import React, {useEffect, useState} from 'react';
import {Institution} from 'src/types/model';
import backArrowIcon from 'src/images/back_arrow.svg';
import {Link} from 'react-router-dom';
import {Styles} from 'src/libs/theme';
import {History} from 'history';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {LabeledField} from 'src/pages/DatasetStatistics';
import {Chip, TextField} from "@mui/material";
import {FormField, FormFieldTypes} from "src/components/forms/forms";
import SimpleTable from "src/components/SimpleTable";

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

    useEffect(() => {
        InstitutionAPI.getById(institutionId).then((resp) => {
            setInstitution(resp);
            setLoading(false);
        });
    }, [institutionId]);

    //todo: decide whether to use the put or the patch endpoint
    const updateInstitution = (updatedInstitution: Institution) => {
        InstitutionAPI.patchInstitution(updatedInstitution).then((resp) => {
            setInstitution(resp);
        });
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
        <div style={{padding: '0 16px', display: 'flex', flexDirection: 'column', width: '100%'}}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
                Back to institutions
            </div>
            <LabeledField label={'Institution Name'}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <FormField
                        type={FormFieldTypes.TEXT}
                        id='institution-name'
                        readOnly={true}
                        defaultValue={institution?.name}
                        onChange={() => console.log('change')}
                        style={{
                            width: '25%', marginTop: '10px', minWidth: 300
                        }}
                    />
                </div>
            </LabeledField>
            <LabeledField label={'Domains'} labelPlacement={'top'}>
                {institution?.domains.map((domain, idx) => (
                    <Chip
                        key={idx}
                        label={domain}
                        variant={'outlined'}
                        style={{marginRight: 5, marginTop: 5, fontSize: 12}}
                        onDelete={() => console.log('deleted!')}
                    />
                ))}
            </LabeledField>
            <div style={{paddingTop: 20, marginTop: 20, borderTop: '1px solid black', width: '100%'}}>
                <div style={{ fontSize: 20, fontWeight: 600, paddingBottom: 10 }}>
                    Signing Officials
                </div>
                {institution?.signingOfficials.map((so) => (

                    <div key={so.userId} style={{display: 'flex', alignItems: 'center', marginBottom: 10}}>
                        <TextField
                            label='Name'
                            value={so.displayName}
                            InputProps={{
                                readOnly: true,
                            }}
                            variant='outlined'
                            style={{marginRight: 10}}
                        />
                        <TextField
                            label='Email'
                            value={so.email}
                            InputProps={{
                                readOnly: true,
                            }}
                            variant='outlined'
                        />
                    </div>
                ))}
                {/*<SimpleTable*/}
                {/*    rowData={signingOfficialData}*/}
                {/*    columnHeaders={headers}*/}
                {/*    styles={styles}*/}
                {/*    tableSize={10}*/}
                {/*    summary='faceted dataset search table'*/}
                {/*/>*/}
            </div>
        </div>
    </div> : <div>Loading</div>;
};
