import React from 'react';
import { TextField } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface SigningOfficialUser {
    userId: string | number;
    displayName: string;
    email: string;
}

interface SigningOfficialsViewProps {
    signingOfficials?: SigningOfficialUser[];
}

export const SigningOfficialsList = ({ signingOfficials = [] }: SigningOfficialsViewProps) => {
    const hasSigningOfficials = signingOfficials && signingOfficials.length > 0;

    return (
        <div style={{paddingTop: 20, marginTop: 20, borderTop: '1px solid', borderColor: '#e1e1e1', width: '100%'}}>
            <div style={{fontSize: 18, fontWeight: 600, paddingBottom: '1rem'}}>
                Signing Officials
            </div>
            <div className={'italic'} style={{display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '2rem'}}>
                <InfoIcon fontSize="large" color="info"/>
                Signing Officials cannot be modified from this page
            </div>
            {!hasSigningOfficials && (
                <div style={{marginBottom: 10}} className={'italic'}>
                    This institution does not have any signing officials
                </div>
            )}
            {hasSigningOfficials && signingOfficials.map((so) => (
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
    );
};
