import { RadioButton } from 'src/components/RadioButton'
import Select from 'react-select'
import { PageHeading } from 'src/components/PageHeading'
import AsyncSelect from 'react-select/async'
import { Styles, Theme } from 'src/libs/theme'
import addDatasetIcon from 'src/images/icon_dataset_add.png'
import React, { useState } from 'react'
import { searchOntologies } from 'src/libs/utils'
import DataProviderAgreement from 'src/assets/Data_Provider_Agreement.pdf'
import eraIcon from 'src/images/era-commons-logo.png'
import { nihAccountLabel } from 'src/components/era_commons/ERACommonsUtils'

interface OntologyOption {
  key: string
  value: string
  label: string
  item?: unknown
}

interface ConsentGroup {
  name: string
  primaryUse: string
  secondaryUse: string
}

export default function NIHICWebform() {
  const [multicenter, setMulticenter] = useState<boolean | undefined>()
  const [individualControlled, setIndividualControlled] = useState<boolean | undefined>()
  const [gsrControlledAccess, setGsrControlledAccess] = useState<boolean | undefined>()
  const [altDataSharing, setAltDataSharing] = useState<boolean | undefined>()
  const [consentGroups, setConsentGroups] = useState<ConsentGroup[]>([])
  const [currentConsentName, setCurrentConsentName] = useState('')
  const [currentConsentGeneral, setCurrentConsentGeneral] = useState<boolean | undefined>()
  const [currentConsentHmb, setCurrentConsentHmb] = useState<boolean | undefined>()
  const [currentConsentDisease, setCurrentConsentDisease] = useState<boolean | undefined>()
  const [currentConsentOntologies, setCurrentConsentOntologies] = useState<OntologyOption[]>([])
  const [currentConsentPoa, setCurrentConsentPoa] = useState<boolean | undefined>()
  const [currentConsentOther, setCurrentConsentOther] = useState<boolean | undefined>()
  const [currentConsentOtherText, setCurrentConsentOtherText] = useState('')
  const [currentConsentNMDS, setCurrentConsentNMDS] = useState<boolean | undefined>()
  const [currentConsentGSO, setCurrentConsentGSO] = useState<boolean | undefined>()
  const [currentConsentPUB, setCurrentConsentPUB] = useState<boolean | undefined>()
  const [currentConsentCOL, setCurrentConsentCOL] = useState<boolean | null | undefined>()
  const [currentConsentIRB, setCurrentConsentIRB] = useState<boolean | undefined>()
  const [currentConsentGS, setCurrentConsentGS] = useState<boolean | undefined>()
  const [currentConsentMOR, setCurrentConsentMOR] = useState<boolean | undefined>()
  const [currentConsentNPOA, setCurrentConsentNPOA] = useState<boolean | undefined>()
  const [currentConsentNPU, setCurrentConsentNPU] = useState<boolean | undefined>()
  const [currentConsentOther2, setCurrentConsentOther2] = useState<boolean | undefined>()
  const [currentConsentOtherText2, setCurrentConsentOtherText2] = useState('')
  const [submissionThreeMonths, setSubmissionThreeMonths] = useState<boolean | undefined>()
  const [submissionBatches, setSubmissionBatches] = useState<boolean | undefined>()
  const [meetTimelines, setMeetTimelines] = useState<boolean | undefined>()
  const accountLabel = nihAccountLabel()

  const controlLabelStyle: React.CSSProperties = {
    fontWeight: 500,
    marginBottom: 0,
  }

  const logoStyle: React.CSSProperties = {
    height: 23,
    width: 38,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundImage: `url(${eraIcon})`,
    display: 'inline-block',
  }

  const nihCenterList = [
    'National Cancer Institute (NCI)',
    'National Eye Institute (NEI)',
    'National Heart, Lung, and Blood Institute (NHLBI)',
    'National Human Genome Research Institute (NHGRI)',
    'National Institute on Aging (NIA)',
    'National Institute on Alcohol Abuse and Alcoholism (NIAAA)',
    'National Institute of Allergy and Infectious Diseases (NIAID)',
    'National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS)',
    'National Institute of Biomedical Imaging and Bioengineering (NIBIB)',
    'Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD)',
    'National Institute on Deafness and Other Communication Disorders (NIDCD)',
    'National Institute of Dental and Craniofacial Research (NIDCR)',
    'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)',
    'National Institute on Drug Abuse (NIDA)',
    'National Institute of Environmental Health Sciences (NIEHS)',
    'National Institute of General Medical Sciences (NIGMS)',
    'National Institute of Mental Health (NIMH)',
    'National Institute on Minority Health and Health Disparities (NIMHD)',
    'National Institute of Neurological Disorders and Stroke (NINDS)',
    'National Institute of Nursing Research (NINR)',
    'National Library of Medicine (NLM)',
    'NIH Office of the Director (OD)',
  ]

  const nihCenterOptions = nihCenterList.map(item => ({ value: item, label: item }))
  const studyTypeOptions = ['Collection', 'Longitudinal', 'Case-control', 'Case set', 'Control set', 'Parent-offspring trios', 'Cohort']
    .map(item => ({ value: item, label: item }))

  const setPrimaryUse = (primaryUse: string, truthValue: boolean | undefined) => {
    if (!truthValue) {
      setCurrentConsentGeneral(false)
      setCurrentConsentHmb(false)
      setCurrentConsentDisease(false)
      setCurrentConsentOntologies([])
      setCurrentConsentPoa(false)
      setCurrentConsentOther(false)
      setCurrentConsentOtherText('')
      if (primaryUse === 'GRU') setCurrentConsentGeneral(true)
      if (primaryUse === 'HMB') setCurrentConsentHmb(true)
      if (primaryUse === 'DIS') setCurrentConsentDisease(true)
      if (primaryUse === 'POA') setCurrentConsentPoa(true)
      if (primaryUse === 'Other') setCurrentConsentOther(true)
    }
  }

  const getPrimaryUse = (): string => {
    let primaryUse = ''
    if (currentConsentGeneral) primaryUse += 'General Research Use: use is permitted for any research purpose'
    if (currentConsentHmb) primaryUse += 'Health/Medical/Biomedical Use: use is permitted for any health, medical, or biomedical purpose'
    if (currentConsentDisease) {
      primaryUse += 'Disease-related studies: use is permitted for research on the specified diseases ['
      currentConsentOntologies.forEach((ont) => {
        primaryUse += ont.label
      })
      primaryUse += ']'
    }
    if (currentConsentPoa) primaryUse += 'Populations, Origins, Ancestry Use: use is permitted exclusively for populations, origins, or ancestry research'
    if (currentConsentOther) {
      primaryUse += 'Other Use: permitted research use is defined as follows: '
      primaryUse += currentConsentOtherText
    }
    return primaryUse
  }

  const getSecondaryUse = (): string => {
    const items: string[] = []
    if (currentConsentNMDS) items.push('No methods development or validation studies (NMDS)')
    if (currentConsentGSO) items.push('Genetic Studies Only (GSO)')
    if (currentConsentPUB) items.push('Publication Required (PUB)')
    if (currentConsentCOL) items.push('Collaboration Required (COL)')
    if (currentConsentIRB) items.push('Ethics Approval Required (IRB)')
    if (currentConsentGS) items.push('Geographic Restriction (GS-)')
    if (currentConsentMOR) items.push('Publication Moratorium (MOR)')
    if (currentConsentNPOA) items.push('No Populations Origins or Ancestry Research (NPOA)')
    if (currentConsentNPU) items.push('Non-Profit Use Only (NPU)')
    if (currentConsentOther2) {
      items.push('Other Secondary Use Terms: ', currentConsentOtherText2)
    }
    return items.join(', ')
  }

  const createConsent = () => {
    setConsentGroups([...consentGroups, { name: currentConsentName, primaryUse: getPrimaryUse(), secondaryUse: getSecondaryUse() }])
    setCurrentConsentName('')
    setCurrentConsentGeneral(false)
    setCurrentConsentHmb(false)
    setCurrentConsentDisease(false)
    setCurrentConsentOntologies([])
    setCurrentConsentPoa(false)
    setCurrentConsentOther(false)
    setCurrentConsentOtherText('')
    setCurrentConsentNMDS(false)
    setCurrentConsentGSO(false)
    setCurrentConsentPUB(false)
    setCurrentConsentCOL(null)
    setCurrentConsentIRB(false)
    setCurrentConsentGS(false)
    setCurrentConsentMOR(false)
    setCurrentConsentNPOA(false)
    setCurrentConsentNPU(false)
    setCurrentConsentOther2(false)
    setCurrentConsentOtherText2('')
  }

  const nihInstituteCheckboxes = [
    { id: 'nhgri', label: 'NHGRI' },
    { id: 'nci', label: 'NCI' },
    { id: 'nhlbi', label: 'NHLBI' },
    { id: 'nimh', label: 'NIMH' },
    { id: 'nidcr', label: 'NIDCR' },
    { id: 'niaid', label: 'NIAID' },
    { id: 'ninds', label: 'NINDS' },
    { id: 'ncats', label: 'NCATS' },
    { id: 'nia', label: 'NIA' },
    { id: 'niddk', label: 'NIDDK' },
    { id: 'nei', label: 'NEI' },
    { id: 'nida', label: 'NIDA' },
  ]

  const secondaryUseCheckboxes = [
    { id: 'checkMethods', name: 'methods', checked: currentConsentNMDS, onChange: () => setCurrentConsentNMDS(!currentConsentNMDS), label: 'No methods development or validation studies (NMDS)' },
    { id: 'checkGenetic', name: 'genetic', checked: currentConsentGSO, onChange: () => setCurrentConsentGSO(!currentConsentGSO), label: 'Genetic Studies Only (GSO)' },
    { id: 'checkPublication', name: 'publication', checked: currentConsentPUB, onChange: () => setCurrentConsentPUB(!currentConsentPUB), label: 'Publication Required (PUB)' },
    { id: 'checkCollaboration', name: 'collaboration', checked: currentConsentCOL ?? false, onChange: () => setCurrentConsentCOL(!currentConsentCOL), label: 'Collaboration Required (COL)' },
    { id: 'checkEthics', name: 'ethics', checked: currentConsentIRB, onChange: () => setCurrentConsentIRB(!currentConsentIRB), label: 'Ethics Approval Required (IRB)' },
    { id: 'checkGeographic', name: 'geographic', checked: currentConsentGS, onChange: () => setCurrentConsentGS(!currentConsentGS), label: 'Geographic Restriction (GS-)' },
    { id: 'checkMoratorium', name: 'moratorium', checked: currentConsentMOR, onChange: () => setCurrentConsentMOR(!currentConsentMOR), label: 'Publication Moratorium (MOR)' },
    { id: 'checkNpoa', name: 'npoa', checked: currentConsentNPOA, onChange: () => setCurrentConsentNPOA(!currentConsentNPOA), label: 'No Populations Origins or Ancestry Research (NPOA)' },
    { id: 'checkForProfit', name: 'forProfit', checked: currentConsentNPU, onChange: () => setCurrentConsentNPU(!currentConsentNPU), label: 'Non-Profit Use Only (NPU)' },
    { id: 'checkOtherSecondary', name: 'other2', checked: currentConsentOther2, onChange: () => setCurrentConsentOther2(!currentConsentOther2), label: 'Other Secondary Use Terms:' },
  ]

  const altSharingReasons = [
    { id: 'legal_restrictions', label: 'Legal Restrictions' },
    { id: 'informed_consent', label: 'Informed consent processes are inadequate to support data sharing for the following reasons:' },
    { id: 'unavailable', label: 'The consent forms are unavailable or non-existent for samples collected after January 25, 2015' },
    { id: 'future_use', label: ' The consent process did not explicitly address future use or broad data sharing for samples collect after January 25, 2015' },
    { id: 'risks', label: 'The consent process inadequately address risks related to future use or broad data sharing for samples collected after January 25, 2015' },
    { id: 'original_use_only', label: 'The consent process specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)' },
    { id: 'limitations', label: 'Other informed consent limitations or concerns' },
    { id: 'other_reason', label: 'Other' },
  ]

  const sampleTypeCheckboxes = [
    { id: 'species', label: 'Species' },
    { id: 'sample_collection', label: 'Sample Collection' },
    { id: 'phenotype', label: 'Phenotype' },
    { id: 'genotype', label: 'Genotypes' },
    { id: 'general', label: 'General' },
    { id: 'sequencing', label: 'Sequencing' },
    { id: 'sample_types', label: 'Sample Types' },
    { id: 'analyses', label: 'Analyses' },
    { id: 'array_data', label: 'Array Data' },
  ]

  return (
    <div style={Styles.PAGE}>
      <div className="row no-margin">
        <PageHeading
          id="nih-ic-webform"
          imgSrc={addDatasetIcon}
          color="common"
          descriptionStyle={{ color: Theme.palette.primary, fontSize: '19px' }}
          title="Extramural Genomic Data Sharing Plan & Institutional Certification"
          description="This integrated GDSP & IC form combines duplicate fields, allows for digital tracking and statistics, and assigns machine-readable GA4GH Data Use Ontology terms to the datasets upon completion!"
        />
      </div>
      <hr className="section-separator" />
      <form name="form" noValidate={true}>
        <div id="form-views">
          <div className="col-lg-10 col-lg-offset-1 col-xs-12">
            <fieldset>
              <h3 className="rp-form-title common-color">Administrative Information</h3>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="piName">Principal Investigator Name </label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="text" name="piName" id="piName" maxLength={256} className="form-control" required={true} />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="piTitle">Principal Investigator Title </label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="text" name="piTitle" id="piTitle" maxLength={256} className="form-control" required={true} />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="piEmail">Principal Investigator Email </label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="url" name="piEmail" id="piEmail" maxLength={256} placeholder="email@domain.org" className="form-control" required={true} />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="piInstitute">Principal Investigator Institution </label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="text" name="piInstitute" id="piInstitute" maxLength={256} className="form-control" required={true} />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="assistantName">Assistant/Submitter Name (if applicable)</label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="text" name="assistantName" id="assistantName" maxLength={256} className="form-control" required={true} />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="assistantEmail">Assistant Submitter Email</label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="text" name="assistantEmail" id="assistantEmail" placeholder="email@domain.org" maxLength={256} className="form-control" required={true} />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <span className="control-label rp-title-question common-color">
                    Authenticate with
                    {accountLabel}
                  </span>
                </div>
                <div className="col-xs-12 rp-group">
                  <button type="button" className="btn-secondary" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                    <div style={logoStyle}></div>
                    <span style={{ verticalAlign: '25%' }}>Authenticate your account</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="inputNIHnumber">NIH Grant or Contract Number </label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="text" name="NIHnumber" id="inputNIHnumber" maxLength={256} className="form-control" required={true} />
                </div>
              </div>

              <div className="form-group" style={{ color: Theme.palette.primary }}>
                <div className="col-xs-12 rp-group">
                  <span className="control-label rp-title-question common-color">NIH Institutes/Centers supporting the study</span>
                </div>
                {nihInstituteCheckboxes.map(({ id, label }) => (
                  <div key={id} className="col-xs-12 rp-group">
                    <div className="checkbox">
                      <input id={id} type="checkbox" />
                      <label className="regular-checkbox rp-choice-questions" htmlFor={id}>
                        <span style={{ color: Theme.palette.primary }}>{label}</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <span className="control-label rp-title-question common-color">NIH Program Officer Name</span>
                </div>
                <div className="col-xs-12 rp-group">
                  <Select
                    name="nihProgramOfficer"
                    id="nihProgramOfficer"
                    blurInputOnSelect={true}
                    openMenuOnFocus={true}
                    isDisabled={false}
                    isClearable={true}
                    isMulti={false}
                    isSearchable={true}
                    options={[{ value: 'Valentina Di Francesco', label: 'Valentina Di Francesco' }, { value: 'Ken Wiley', label: 'Ken Wiley' }]}
                    placeholder="Select a Program Officer..."
                    className=""
                    required={true}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <span className="control-label rp-title-question common-color">NIH Institute/Center for Submission</span>
                </div>
                <div className="col-xs-12 rp-group">
                  <Select
                    name="nihCenterSubmission"
                    id="nihCenterSubmission"
                    blurInputOnSelect={true}
                    openMenuOnFocus={true}
                    isDisabled={false}
                    isClearable={true}
                    isMulti={false}
                    isSearchable={true}
                    options={nihCenterOptions}
                    placeholder="Select an NIH IC..."
                    className=""
                    required={true}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <span className="control-label rp-title-question common-color">NIH Genomic Program Administrator Name</span>
                </div>
                <div className="col-xs-12 rp-group">
                  <Select
                    name="nihProgramAdmin"
                    id="nihProgramAdmin"
                    blurInputOnSelect={true}
                    openMenuOnFocus={true}
                    isDisabled={false}
                    isClearable={true}
                    isMulti={false}
                    isSearchable={true}
                    options={[{ value: 'Jennifer Strasburger', label: 'Jennifer Strasburger' }]}
                    placeholder="Select a Genomic Program Administrator..."
                    className=""
                    required={true}
                  />
                </div>
              </div>
            </fieldset>

            <h3 className="rp-form-title common-color">Study/Dataset Information</h3>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="originalName">Original Study Name</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="originalName" id="originalName" maxLength={256} className="form-control" required={true} />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">Study Type</span>
              </div>
              <div className="col-xs-12 rp-group">
                <Select
                  name="studyType"
                  id="studyType"
                  blurInputOnSelect={true}
                  openMenuOnFocus={true}
                  isDisabled={false}
                  isClearable
                  isMulti={false}
                  isSearchable
                  options={studyTypeOptions}
                  placeholder="Select a study type..."
                  className=""
                  required={true}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="projectTitle">Project Title (for data to be submitted)</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="projectTitle" id="projectTitle" maxLength={256} className="form-control" required={true} />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">Is this a multi-center study?</span>
              </div>
              <div className="row no-margin">
                <div className="col-xs-12 dataset-group">
                  <RadioButton style={{ color: Theme.palette.primary }} id="multicenter_yes" defaultChecked={multicenter} onClick={() => setMulticenter(true)} label="Yes" disabled={false} />
                  <RadioButton style={{ color: Theme.palette.primary }} id="multicenter_no" defaultChecked={multicenter === false} onClick={() => setMulticenter(false)} label="No" disabled={false} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="inputcollaboratingsites">List Collaborating Sites (please enter a comma or tab delimited list)</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="collaboratingsites" id="inputcollaboratingsites" maxLength={256} required={true} className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">The individual level data are to be made available through:</span>
              </div>
              <div className="row no-margin">
                <div className="col-xs-12 dataset-group">
                  <RadioButton style={{ color: Theme.palette.primary }} id="individual_unrestricted" label="Unrestricted Access" defaultChecked={individualControlled === false} onClick={() => setIndividualControlled(false)} />
                  <RadioButton style={{ color: Theme.palette.primary }} id="individual_controlled" label="Controlled Access" defaultChecked={individualControlled} onClick={() => setIndividualControlled(true)} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">The genomic summary results (GSR) from this study are only to be made available through controlled-access</span>
              </div>
              <div className="row no-margin">
                <div className="col-xs-12 dataset-group">
                  <RadioButton style={{ color: Theme.palette.primary }} id="gsr_controlled_yes" defaultChecked={gsrControlledAccess} onClick={() => setGsrControlledAccess(true)} label="Yes" disabled={false} />
                  <RadioButton style={{ color: Theme.palette.primary }} id="gsr_controlled_no" defaultChecked={gsrControlledAccess === false} onClick={() => setGsrControlledAccess(false)} label="No" disabled={false} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="explanation">Explanation if controlled-access for GSR was selected</label>
              </div>
              <div style={{ marginLeft: '15px' }}>
                <input type="text" name="explanation" id="explanation" maxLength={256} className="form-control" required={true} />
              </div>
            </div>

            <div style={{ backgroundColor: Theme.palette.background.secondary, borderRadius: '9px' }}>
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="consentGroupName">Consent Group - Name:</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input
                  type="text"
                  name="consentGroupName"
                  id="consentGroupName"
                  value={currentConsentName}
                  onChange={e => setCurrentConsentName(e.target.value)}
                  maxLength={256}
                  className="form-control"
                  required={true}
                />
              </div>
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">Consent Group - Primary Data Use Terms <span>Please select one of the following data use permissions for your dataset.</span></span>
                <div className="row">
                  <div className="col-xs-12 rp-group">
                    <div style={{ margin: '15px 0' }}>
                      <RadioButton style={{ color: Theme.palette.primary }} id="checkGeneral" defaultChecked={currentConsentGeneral} onClick={() => setPrimaryUse('GRU', currentConsentGeneral)} label="General Research Use: " description="use is permitted for any research purpose" disabled={false} />
                      <RadioButton style={{ color: Theme.palette.primary }} id="checkHmb" label="Health/Medical/Biomedical Use: " defaultChecked={currentConsentHmb} onClick={() => setPrimaryUse('HMB', currentConsentHmb)} description="use is permitted for any health, medical, or biomedical purpose" disabled={false} />
                      <RadioButton style={{ color: Theme.palette.primary }} id="checkDisease" defaultChecked={currentConsentDisease} onClick={() => setPrimaryUse('DIS', currentConsentDisease)} label="Disease-related studies: " description="use is permitted for research on the specified disease" disabled={false} />
                      <div style={{ color: Theme.palette.primary }}>
                        <AsyncSelect
                          id="sel_diseases"
                          isDisabled={!currentConsentDisease}
                          isMulti={true}
                          value={currentConsentOntologies}
                          loadOptions={(query, callback) => searchOntologies(query, callback)}
                          onChange={data => setCurrentConsentOntologies((data as OntologyOption[]) ?? [])}
                          placeholder="Please enter one or more diseases"
                          classNamePrefix="select"
                        />
                      </div>
                    </div>
                    <RadioButton style={{ color: Theme.palette.primary }} id="checkPoa" defaultChecked={currentConsentPoa} onClick={() => setPrimaryUse('POA', currentConsentPoa)} label="Populations, Origins, Ancestry Use: " description="use is permitted exclusively for populations, origins, or ancestry research" disabled={false} />
                    <RadioButton style={{ color: Theme.palette.primary }} id="checkOther" defaultChecked={currentConsentOther} onClick={() => setPrimaryUse('Other', currentConsentOther)} label="Other Use:" description="permitted research use is defined as follows: " disabled={false} />
                    <textarea
                      disabled={!currentConsentOther}
                      value={currentConsentOtherText}
                      onChange={e => setCurrentConsentOtherText(e.target.value)}
                      className="form-control"
                      name="otherText"
                      id="otherText"
                      maxLength={512}
                      rows={2}
                      placeholder="Please specify if selected (max. 512 characters)"
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <span className="control-label rp-title-question common-color">Consent Group - Secondary Data Use Terms <span>Please select all applicable data use parameters.</span></span>
                </div>
              </div>
              {secondaryUseCheckboxes.map(({ id, name, checked, onChange, label }) => (
                <div key={id} className="col-xs-12 rp-group">
                  <div className="checkbox">
                    <input id={id} type="checkbox" className="checkbox-inline rp-checkbox" name={name} checked={checked ?? false} onChange={onChange} />
                    <label className="regular-checkbox rp-choice-questions" htmlFor={id}>
                      <span style={{ color: Theme.palette.primary }}>{label}</span>
                    </label>
                  </div>
                </div>
              ))}
              <div className="col-xs-12 rp-group">
                <textarea
                  disabled={!currentConsentOther2}
                  value={currentConsentOtherText2}
                  onChange={e => setCurrentConsentOtherText2(e.target.value)}
                  name="otherText2"
                  id="inputOtherText"
                  className="form-control"
                  rows={6}
                  required={false}
                  placeholder="Note - adding free text data use terms in the box will inhibit your dataset from being read by the DUOS Algorithm for decision support."
                />
              </div>
              <div className="row no-margin">
                <div className="col-xs-12">
                  <button type="button" id="btn_addConsent" onClick={createConsent} className="f-right btn-primary bold">Add Consent Group</button>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: Theme.palette.background.secondary, borderRadius: '9px', margin: '15px 0' }}>
              {consentGroups.map((group, index) => (
                <div key={group.name} style={{ padding: '10px', margin: '15px', color: Theme.palette.primary }}>
                  <div style={{ fontSize: '18px', padding: '10px 0', fontWeight: 500 }}>
                    Consent Group {index + 1}
                  </div>
                  <div style={{ display: 'flex', fontSize: '16px' }}>
                    <div style={{ fontWeight: 500, marginRight: '5px' }}>Name: </div>
                    <div>{group.name}</div>
                  </div>
                  <div style={{ display: 'flex', fontSize: '16px' }}>
                    <div style={{ fontWeight: 500, marginRight: '5px' }}>Primary Use: </div>
                    <div>{group.primaryUse}</div>
                  </div>
                  <div style={{ display: 'flex', fontSize: '16px' }}>
                    <div style={{ fontWeight: 500, marginRight: '5px' }}>Secondary Use: </div>
                    <div>{group.secondaryUse}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">
                  Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public database or repository?
                </span>
              </div>
              <div className="row no-margin">
                <div className=" col-xs-12 dataset-group">
                  <RadioButton style={{ color: Theme.palette.primary }} id="altDataSharing_yes" defaultChecked={altDataSharing} onClick={() => setAltDataSharing(true)} label="Yes" disabled={false} />
                  <RadioButton style={{ color: Theme.palette.primary }} id="altDataSharing_no" defaultChecked={altDataSharing === false} onClick={() => setAltDataSharing(false)} label="No" disabled={false} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">
                  Please mark the reasons for which you are requesting an Alternative Data Sharing Plan
                </span>
              </div>
              {altSharingReasons.map(({ id, label }) => (
                <div key={id} className="col-xs-12 rp-group">
                  <div className="checkbox">
                    <input id={id} type="checkbox" />
                    <label className="regular-checkbox rp-choice-questions" htmlFor={id}>
                      <span style={{ color: Theme.palette.primary }}>{label}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="inputexplanation">Explanation for Request</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="altSharingExplanation" id="inputexplanation" maxLength={256} required={true} className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="inputDescription">Alternative Data Sharing Plan</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="altSharingPlan" id="inputDescription" maxLength={256} required={true} className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="inputAcknowledgement">If needed, please include additional information</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="Acknowledgement" id="inputAcknowledgement" maxLength={256} className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">Data will be submitted</span>
              </div>
              <div className="row no-margin">
                <div className="col-xs-12 dataset-group">
                  <RadioButton
                    style={{ color: Theme.palette.primary }}
                    id="submission_3months"
                    label="within 3 months of last data generated or last clinical visit"
                    defaultChecked={submissionThreeMonths}
                    onClick={() => {
                      setSubmissionThreeMonths(true)
                      setSubmissionBatches(false)
                    }}
                  />
                  <RadioButton
                    style={{ color: Theme.palette.primary }}
                    id="submission_batches"
                    label="by batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)"
                    defaultChecked={submissionBatches}
                    onClick={() => {
                      setSubmissionBatches(true)
                      setSubmissionThreeMonths(false)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">
                  Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release
                </span>
              </div>
              <div className="row no-margin">
                <div className="col-xs-12 dataset-group">
                  <RadioButton style={{ color: Theme.palette.primary }} id="meetTimelines_yes" label="Yes" defaultChecked={meetTimelines} onClick={() => setMeetTimelines(true)} />
                  <RadioButton style={{ color: Theme.palette.primary }} id="meetTimelines_no" label="No" defaultChecked={meetTimelines === false} onClick={() => setMeetTimelines(false)} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="deliveryDate">Target data delivery date</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" id="deliveryDate" maxLength={256} className="form-control" placeholder="MM/DD/YYYY" />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="releaseDate">Target public release date</label>
              </div>
              <div className="col-xs-12 rp-group">
                <input type="text" id="releaseDate" maxLength={256} className="form-control" placeholder="MM/DD/YYYY" />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="inputbytesofdata">Estimated # of bytes of data to be deposited</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="bytesOfData" id="inputbytesofdata" maxLength={256} className="form-control" required={true} />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <label className="control-label rp-title-question common-color" htmlFor="inputstudyparticipants">Estimated # of Study Participants</label>
              </div>
              <div className="col-xs-12 rp-group rp-last-group">
                <input type="text" name="studyparticipants" id="inputstudyparticipants" maxLength={256} className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <div className="col-xs-12 rp-group">
                <span className="control-label rp-title-question common-color">
                  Samples genotyped/sequenced (check all data types expected for this study)
                </span>
              </div>
              {sampleTypeCheckboxes.map(({ id, label }) => (
                <div key={id} className="col-xs-12 rp-group">
                  <div className="checkbox">
                    <input id={id} type="checkbox" />
                    <label className="regular-checkbox rp-choice-questions" htmlFor={id}>
                      <span style={{ color: Theme.palette.primary }}>{label}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <div className="col-xs-12">
                <span className="control-label rp-title-question common-color">Dataset Registration Agreement</span>
              </div>
              <div className="row no-margin">
                <div className="col-xs-12 rp-group">
                  <span style={controlLabelStyle} className="default-color">
                    By submitting this dataset registration, you agree to comply with all terms put forth in the agreement.
                  </span>
                </div>
                <div className="col-xs-12 rp-group">
                  <a
                    id="link_downloadAgreement"
                    rel="noreferrer"
                    href={DataProviderAgreement}
                    target="_blank"
                    className="col-md-4 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color"
                  >
                    <span className="glyphicon glyphicon-download"></span>
                    {' '}Dataset Registration Agreement
                  </a>
                </div>
              </div>

              <div className="form-group">
                <div className="col-xs-12 rp-group">
                  <label className="control-label rp-title-question common-color" htmlFor="piSignature">Principal Investigator Signature</label>
                </div>
                <div className="col-xs-12 rp-group rp-last-group">
                  <input type="text" name="piSignature" id="piSignature" maxLength={256} className="form-control" required={true} />
                </div>
              </div>

              <div className="row no-margin">
                <div className="col-xs-12">
                  <button type="submit" id="btn_submit" className="f-right btn-primary dataset-background bold">Submit to Signing Official</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
