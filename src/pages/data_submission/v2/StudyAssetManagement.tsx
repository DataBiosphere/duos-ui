import { Study } from 'src/pages/data_submission/v2/v2-models'
import React, { ReactNode } from 'react'
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
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import DescriptionIcon from '@mui/icons-material/Description'
import MonitorIcon from '@mui/icons-material/Monitor'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import StorageIcon from '@mui/icons-material/Storage'
import LaptopMacIcon from '@mui/icons-material/LaptopMac'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'

export interface StudyAssetManagementProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

export const StudyAssetManagement = (props: StudyAssetManagementProps) => {
  const { setStudy, study } = props

  const onAssetChange = <K extends keyof NonNullable<Study['assets']>>(
    assetType: K,
    value: NonNullable<Study['assets']>[K],
  ) => {
    setStudy(prev => ({
      ...prev,
      assets: { ...prev.assets, [assetType]: value },
    }))
  }

  const models = study.assets?.models || []
  const workspaces = study.assets?.workspaces || []
  const publications = study.assets?.publications || []
  const presentations = study.assets?.presentations || []
  const clinicalTrials = study.assets?.clinicalTrials || []
  const intellectualProperties = study.assets?.intellectualProperty || []
  const fundingResources = study.assets?.funding || []

  return (
    <div className="data-submitter-section">
      <h2>Study Assets</h2>
      <p>Add datasets, models, workspaces, and other resources associated with this study</p>

      {/*
        TODO: DT-2382: Add DatasetList component here
        */}

      <AiModelList
        aiModels={models}
        onAiModelsChange={(models: AiModel[]) => onAssetChange('models', models)}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: <StorageIcon fontSize="large" />,
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
        onWorkspaceChange={(workspaces: Workspace[]) => onAssetChange('workspaces', workspaces)}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: <LaptopMacIcon fontSize="large" />,
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
        onPublicationChange={(publications: Publication[]) => onAssetChange('publications', publications)}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: <DescriptionIcon fontSize="large" />,
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
        onPresentationChange={(presentations: Presentation[]) => onAssetChange('presentations', presentations)}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: <MonitorIcon fontSize="large" />,
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
        onClinicalTrialChange={(clinicalTrials: ClinicalTrial[]) => onAssetChange('clinicalTrials', clinicalTrials)}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: <LocalHospitalIcon fontSize="large" />,
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
        onIntellectualPropertyChange={(intellectualProperties: IntellectualProperty[]) => onAssetChange('intellectualProperty', intellectualProperties)}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: <VerifiedUserIcon fontSize="large" />,
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
        onFundingResourceChange={(fundingResources: FundingResource[]) => onAssetChange('funding', fundingResources)}
        disabled={false}
        studyAssetWrapper={(content: ReactNode, button: ReactNode) => (
          <StudyAsset
            config={{
              icon: <AttachMoneyIcon fontSize="large" />,
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
