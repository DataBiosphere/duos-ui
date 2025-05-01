import React from 'react';

export type NIHDataUseCertificationAgreementProps = {
    className: string | null
    showDownloadIcon: boolean | null
}
export const NIHDataUseCertificationAgreement = (props: NIHDataUseCertificationAgreementProps) => {
    const {className, showDownloadIcon} = props;
    return (
        <a
        href={'https://sharing.nih.gov/accessing-data/accessing-genomic-data/using-genomic-data-responsibly/nih-data-use-certification-agreement'}
        target={'_blank'}
        rel={'noreferrer'}
        className={className ? className : ''}
        >{showDownloadIcon && (<span className={'glyphicon glyphicon-download'}/>)} NIH Data Use Certification Agreement</a>)
}