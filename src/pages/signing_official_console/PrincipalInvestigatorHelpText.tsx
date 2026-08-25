import React from 'react'

/**
 * The DUOS definition of a qualifying Principal Investigator, shown as help text
 * on the Signing Official Console pages where an SO acts on that judgement —
 * pre-authorizing researchers and approving their Data Access Requests.
 *
 * The qualification language is the same one an SO attests to when approving an
 * individual DAR; see the approval attestation in
 * `src/components/dar_collection_table/CollectionConfirmationModal.tsx`.
 */
export const PrincipalInvestigatorHelpText: React.FC = () => {
  return (
    <div
      data-cy="pi-help-text"
      style={{ fontFamily: 'Montserrat', fontSize: '1.4rem', lineHeight: '2rem' }}
    >
      <div style={{ fontWeight: 600 }}>Who qualifies as a Principal Investigator?</div>
      <div>
        <strong>Principal Investigator (PI):</strong> is a permanent employee of their institution at a level equivalent to, but not limited to, that of an academic professor (e.g., assistant, associate, or non-tenure or tenure-track professor) or senior researcher. This does not include lab technicians or trainees, e.g., post-docs or graduate students.
      </div>
    </div>
  )
}

export default PrincipalInvestigatorHelpText
