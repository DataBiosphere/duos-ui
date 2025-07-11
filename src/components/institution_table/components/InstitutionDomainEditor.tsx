import {Button, Chip, TextField} from '@mui/material';
import React, {useState} from 'react';

interface DomainEditorProps {
    domains: string[];
    editMode: boolean;
    onDomainsChange?: (domains: string[]) => void;
}

export const InstitutionDomainEditor = ({ domains = [], editMode, onDomainsChange }: DomainEditorProps) => {
    const [tempDomain, setTempDomain] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleDomainDelete = (domainToDelete: string) => {
        if (onDomainsChange) {
            const updatedDomains = domains.filter(domain => domain !== domainToDelete);
            onDomainsChange(updatedDomains);
        }
    };

    const handleDomainAdd = () => {
        const trimmedDomain = tempDomain.trim();
        if (trimmedDomain) {
            if (domains.includes(trimmedDomain)) {
                setErrorMessage('This domain has already been added');
            } else if (onDomainsChange) {
                const updatedDomains = [...domains, trimmedDomain];
                onDomainsChange(updatedDomains);
                setTempDomain('');
                setErrorMessage('');
            }
        }
    };

    return (
        <div style={{paddingTop: 20}}>
            <div style={{fontWeight: 600, marginBottom: '0.5rem', fontSize: 18}}>Domains</div>
            <div>
                {domains.map(domain => (
                    <DomainChip
                        key={domain}
                        domain={domain}
                        editMode={editMode}
                        onDelete={() => handleDomainDelete(domain)}
                    />
                ))}
            </div>

            {(!editMode && domains.length === 0) &&
                <div className={'italic'}>This institution is not associated with any domains</div>
            }

            {editMode && (
                <div style={{display: 'flex', flexDirection: 'column', marginTop: 10}}>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        <TextField
                            variant='outlined'
                            value={tempDomain}
                            placeholder={'Domain'}
                            size="small"
                            InputProps={{
                                style: {fontSize: 14}
                            }}
                            style={{width: 250}}
                            onChange={(e) => {
                                setTempDomain(e.target.value);
                                setErrorMessage('');
                            }}
                            error={!!errorMessage}
                        />
                        <Button
                            variant="contained"
                            onClick={handleDomainAdd}
                            style={{marginLeft: 10, fontSize: 14, width: 'auto'}}
                            disabled={!tempDomain.trim()}
                        >
                            Add
                        </Button>
                    </div>
                    {errorMessage && (
                        <div style={{color: 'red', fontSize: 12, marginTop: 4, marginLeft: 2}}>
                            {errorMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface DomainChipProps {
    domain: string;
    editMode: boolean;
    onDelete?: () => void;
}

const DomainChip = ({ domain, editMode, onDelete }: DomainChipProps) => {
    return (
        <Chip
            key={domain}
            label={domain}
            variant={'outlined'}
            style={{
                marginRight: 5,
                fontSize: 12,
                color: editMode ? undefined : '#7b7b7b',
                borderColor: editMode ? undefined : '#7b7b7b'
            }}
            onDelete={editMode ? onDelete : undefined}
        />
    );
};
