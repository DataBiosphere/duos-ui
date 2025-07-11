import {Button, Chip, TextField} from '@mui/material';
import React, {useState} from 'react';

interface DomainEditorProps {
    domains: string[];
    editMode: boolean;
    onDomainsChange?: (domains: string[]) => void;
}

export const InstitutionDomainEditor = ({ domains = [], editMode, onDomainsChange }: DomainEditorProps) => {
    const [tempDomain, setTempDomain] = useState<string>('');

    const handleDomainDelete = (domainToDelete: string) => {
        if (onDomainsChange) {
            const updatedDomains = domains.filter(domain => domain !== domainToDelete);
            onDomainsChange(updatedDomains);
        }
    };

    const handleDomainAdd = () => {
        const trimmedDomain = tempDomain.trim();
        if (trimmedDomain && !domains.includes(trimmedDomain) && onDomainsChange) {
            const updatedDomains = [...domains, trimmedDomain];
            onDomainsChange(updatedDomains);
            setTempDomain('');
        }
    };

    return (
        <div style={{paddingTop: 20}}>
            <div style={{fontWeight: 600, marginBottom: '0.5rem', fontSize: 18}}>Domains</div>
            <div>
                {domains.map((domain, idx) => (
                    <DomainChip
                        key={idx}
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
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 10}}>
                    <TextField
                        variant='outlined'
                        value={tempDomain}
                        placeholder={'Domain'}
                        size="small"
                        InputProps={{
                            style: {fontSize: 14}
                        }}
                        style={{width: 250}}
                        onChange={(e) => setTempDomain(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleDomainAdd();
                            }
                        }}
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
