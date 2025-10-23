import { Dataset, FileStorageObject } from 'src/types/model'

export type MasterChangeHandler = {
  onChange: ({ key, value }: {
    key: string
    value: unknown
  }) => void
}

export type StudyPropertyType = 'Boolean' | 'String' | 'Number' | 'Date' | 'Json'

export class StudyProperty {
  key: string
  studyPropertyId?: number
  studyId?: number
  type: StudyPropertyType
  value: unknown

  constructor(key: string, type: StudyPropertyType, value: unknown, studyId?: number, studyPropertyId?: number) {
    this.key = key
    this.studyId = studyId
    this.studyPropertyId = studyPropertyId
    this.type = type
    this.value = value
  }

  toJSON() {
    const obj = {
      key: this.key,
      value: this.value,
      studyId: this.studyId,
      studyPropertyId: this.studyPropertyId,
    }
    if (!obj.studyId) {
      delete obj.studyId
    }
    if (!obj.studyPropertyId) {
      delete obj.studyPropertyId
    }
    return obj
  }
}

export class NihGrantContractNumber extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('nihGrantContractNumber', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class SubmittingToAnvil extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('submittingToAnvil', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanTargetPublicReleaseDate extends StudyProperty {
  constructor(value: Date, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanTargetPublicReleaseDate', 'Date' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanFileName extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanFileName', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DbGaPStudyRegistrationName extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('dbGaPStudyRegistrationName', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class PiInstitution extends StudyProperty {
  constructor(value: number, studyId?: number, studyPropertyId?: number) {
    super('piInstitution', 'Number' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DataCustodianEmail extends StudyProperty {
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('dataCustodianEmail', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanTargetDeliveryDate extends StudyProperty {
  constructor(value: Date, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanTargetDeliveryDate', 'Date' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class PhenotypeIndication extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('phenotypeIndication', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanExplanation extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanExplanation', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanReasons extends StudyProperty {
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanReasons', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class Species extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('species', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihICsSupportingStudy extends StudyProperty {
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('nihICsSupportingStudy', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanDataSubmitted extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanDataSubmitted', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanControlledOpenAccess extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanControlledOpenAccess', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihInstitutionCenterSubmission extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('nihInstitutionCenterSubmission', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class MultiCenterStudy extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('multiCenterStudy', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlan extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlan', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class DbGaPPhsID extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('dbGaPPhsID', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class EmbargoReleaseDate extends StudyProperty {
  constructor(value: Date, studyId?: number, studyPropertyId?: number) {
    super('embargoReleaseDate', 'Date' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class StudyType extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('studyType', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class SequencingCenter extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('sequencingCenter', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class AlternativeDataSharingPlanDataReleased extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('alternativeDataSharingPlanDataReleased', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class ControlledAccessRequiredForGenomicSummaryResultsGSR extends StudyProperty {
  constructor(value: boolean, studyId?: number, studyPropertyId?: number) {
    super('controlledAccessRequiredForGenomicSummaryResultsGSR', 'Boolean' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihProgramOfficerName extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('nihProgramOfficerName', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihAnvilUse extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('nihAnvilUse', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class NihGenomicProgramAdministratorName extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('nihGenomicProgramAdministratorName', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class CollaboratingSites extends StudyProperty {
  constructor(value: string[], studyId?: number, studyPropertyId?: number) {
    super('collaboratingSites', 'Json' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export class ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation extends StudyProperty {
  constructor(value: string, studyId?: number, studyPropertyId?: number) {
    super('controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation', 'String' as StudyPropertyType, value, studyId, studyPropertyId)
  }
}

export interface Study {
  studyId?: number
  uuid?: string
  name?: string
  description?: string
  dataTypes?: string[]
  piName?: string
  publicVisibility?: boolean
  datasetIds?: number[]
  datasets?: Dataset[]
  properties?: StudyProperty[]
  alternativeDataSharingPlan?: FileStorageObject
  createDate?: string // Date?
  createUserId?: number
  updateDate?: string // Date?
  updateUserId?: number
}
