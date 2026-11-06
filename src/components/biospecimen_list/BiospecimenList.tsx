import { Biospecimen } from 'src/types/model'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import React, { useEffect, useState } from 'react'
import { Countries } from 'src/libs/ajax/Countries'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'
import BiospecimenAddEdit from 'src/components/biospecimen_list/BiospecimenAddEdit'
import BiospecimenRow from 'src/components/biospecimen_list/BiospecimenRow'

export default function BiospecimenList(props: {
  readonly biospecimens: Biospecimen[]
  readonly columnsToShow?: (keyof Biospecimen)[]
  readonly onBiospecimenChange: (biospecimens: Biospecimen[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}) {
  const [countries, setCountries] = useState<string[]>([])

  useEffect(() => {
    let active = true
    // Country of origin is optional, so the form still works with an empty list if this fails.
    Countries.getCountries()
      .then((list) => { if (active) setCountries(list) })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <StudyAssetList<
      Biospecimen,
      DarErrors,
      React.ComponentProps<typeof BiospecimenAddEdit>,
      React.ComponentProps<typeof BiospecimenRow>
    >
      items={props.biospecimens}
      columnsToShow={props.columnsToShow ?? ['donorId', 'specimenType', 'preservationMethod', 'organization']}
      onItemsChange={props.onBiospecimenChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={BiospecimenAddEdit}
      RowComponent={BiospecimenRow}
      addButtonId="add-biospecimen-btn"
      addButtonLabel="Add Biospecimen"
      getValidationState={v => v?.biospecimens}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        biospecimens: items,
        closeAction,
        onBiospecimensChange: onItemsChange,
        countries,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        biospecimen: baseProps.item,
        biospecimens: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onBiospecimensChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
        countries,
      })}
      getItemKey={item => item.biospecimenId}
    />
  )
}
