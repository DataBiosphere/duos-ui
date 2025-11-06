import { Study } from 'src/pages/data_submission/v2/v2-models'
import React, { ReactNode, useState } from 'react'
import PublicationList from 'src/components/publications_list/PublicationList'
import PresentationList from 'src/components/presentations_list/PresentationList'
import IntellectualPropertyList from 'src/components/intellectual_property_list/IntellectualPropertyList'
import {
  AiModel,
  ClinicalTrial,
  FundingResource,
  IntellectualProperty,
  Presentation,
  Publication,
  Workspace,
} from 'src/types/model'
import { StudyAsset } from 'src/pages/data_submission/v2/StudyAsset'
import AiModelList from 'src/components/ai_models_list/AiModelList'
import WorkspaceList from 'src/components/workspaces_list/WorkspaceList'
import ClinicalTrialList from 'src/components/clinical_trial_list/ClinicalTrialList'
import FundingResourceList from 'src/components/funding_resource_list/FundingResourceList'

export interface StudyAssetManagementProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

export const StudyAssetManagement = (props: StudyAssetManagementProps) => {
  const { setStudy, study } = props

  const [models, setModels] = useState<AiModel[]>(study.assets?.models || [])
  const [workspaces, setWorkspaces] = useState<Workspace[]>(study.assets?.workspaces || [])
  const [publications, setPublications] = useState<Publication[]>(study.assets?.publications || [])
  const [presentations, setPresentations] = useState<Presentation[]>(study.assets?.presentations || [])
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>(study.assets?.clinicalTrials || [])
  const [intellectualProperties, setIntellectualProperties] = useState<IntellectualProperty[]>(study.assets?.intellectualProperty || [])
  const [fundingResources, setFundingResources] = useState<FundingResource[]>(study.assets?.funding || [])

  const onModelChange = (models: AiModel[]) => {
    setModels(models)
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, models },
    }))
  }

  const onWorkspaceChange = (workspaces: Workspace[]) => {
    setWorkspaces(workspaces)
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, workspaces },
    }))
  }

  const onPublicationChange = (publications: Publication[]) => {
    setPublications(publications)
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, publications },
    }))
  }

  const onPresentationChange = (presentations: Presentation[]) => {
    setPresentations(presentations)
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, presentations },
    }))
  }

  const onClinicalTrialChange = (clinicalTrials: ClinicalTrial[]) => {
    setClinicalTrials(clinicalTrials)
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, clinicalTrials },
    }))
  }

  const onIntellectualPropertyChange = (intellectualProperties: IntellectualProperty[]) => {
    setIntellectualProperties(intellectualProperties)
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, intellectualProperty: intellectualProperties },
    }))
  }

  const onFundingResourceChange = (fundingResources: FundingResource[]) => {
    setFundingResources(fundingResources)
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, funding: fundingResources },
    }))
  }

  return (
    <div className="data-submitter-section">
      <h2>Study Assets</h2>
      <p>Add datasets, models, workspaces, and other resources associated with this study</p>

      <AiModelList
        aiModels={models}
        onAiModelsChange={onModelChange}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: 'glyphicon glyphicon-cog',
              title: 'Models',
              description: 'Add computational models or algorithms derived from this study',
              children: content,
              button: button,
            }}
          />
        )}
      />

      <WorkspaceList
        workspaces={workspaces}
        onWorkspaceChange={onWorkspaceChange}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: 'glyphicon glyphicon-briefcase',
              title: 'Featured Workspaces',
              description: 'Add computational workspaces for data analysis',
              children: content,
              button: button,
            }}
          />
        )}
      />

      <PublicationList
        publications={publications}
        onPublicationChange={onPublicationChange}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: 'glyphicon glyphicon-file',
              title: 'Publications',
              description: 'Add published research papers related to this study',
              children: content,
              button: button,
            }}
          />
        )}
      />

      <PresentationList
        presentations={presentations}
        onPresentationChange={onPresentationChange}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: 'glyphicon glyphicon-bullhorn',
              title: 'Presentations',
              description: 'Add conference presentations or talks about this study',
              children: content,
              button: button,
            }}
          />
        )}
      />

      <ClinicalTrialList
        clinicalTrials={clinicalTrials}
        onClinicalTrialChange={onClinicalTrialChange}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: 'glyphicon glyphicon-stats',
              title: 'Clinical Trials',
              description: 'Add clinical trials associated with this study',
              children: content,
              button: button,
            }}
          />
        )}
      />

      <IntellectualPropertyList
        intellectualProperties={intellectualProperties}
        onIntellectualPropertyChange={onIntellectualPropertyChange}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: 'glyphicon glyphicon-copyright-mark',
              title: 'Intellectual Property',
              description: 'Add patents or other IP related to this study',
              children: content,
              button: button,
            }}
          />
        )}
      />

      <FundingResourceList
        fundingResources={fundingResources}
        onFundingResourceChange={onFundingResourceChange}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: 'glyphicon glyphicon-usd',
              title: 'Funding Resources',
              description: 'Add grants and funding sources for this study',
              children: content,
              button: button,
            }}
          />
        )}
      />
    </div>
  )
}
