import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import Actions, { ActionsProps } from 'src/components/dar_collection_table/Actions'
import { Navigation } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import EnvironmentUtils from 'src/utils/EnvironmentUtils'
import { DarCollectionSummary } from 'src/types/model'

vi.mock('src/libs/utils', async () => {
  const actual = await vi.importActual<typeof import('src/libs/utils')>('src/libs/utils')
  return {
    ...actual,
    Navigation: {
      ...actual.Navigation,
      console: vi.fn().mockResolvedValue({}),
    },
  }
})

vi.mock('src/libs/storage', async () => {
  const actual = await vi.importActual<typeof import('src/libs/storage')>('src/libs/storage')
  return {
    ...actual,
    Storage: {
      ...actual.Storage,
      getCurrentUser: vi.fn(),
      getEnv: vi.fn(),
    },
  }
})

const collectionId = 1
const refId1 = '0a4jn-g838d-bsdg8-6s7fs7'

const darColl = {
  darCollectionId: collectionId,
  referenceIds: ['4a3fd-g77fd-2f345-4h2g31', '0a4jn-g838d-bsdg8-6s7fs7'],
  darCode: 'DAR-9583',
  name: 'Example DAR 1',
  submissionDate: 1658880000000,
  researcherName: 'John Doe',
  institutionName: 'Broad Institute',
  status: 'Draft',
  actions: [],
  dacNames: [],
  dacCode: '',
  datasetCount: 4,
  datasetIds: [],
  expired: false,
  expiresAt: 0,
  latestReferenceId: '',
  progressReport: false,
  requiresSOApproval: false,
} as unknown as DarCollectionSummary

const draftDarColl = {
  darCollectionId: null,
  referenceIds: [refId1],
  darCode: 'DRAFT-023',
  name: null,
  submissionDate: 1658880000000,
  researcherName: null,
  institutionName: null,
  status: 'Draft',
  actions: [],
  dacNames: [],
  dacCode: '',
  datasetCount: 10,
  datasetIds: [],
  expired: false,
  expiresAt: 0,
  latestReferenceId: '',
  progressReport: false,
  requiresSOApproval: false,
} as unknown as DarCollectionSummary

const baseProps: ActionsProps = {
  consoleType: 'chair',
  collection: darColl,
  showConfirmationModal: vi.fn(),
}

let propCopy: ActionsProps

beforeEach(() => {
  propCopy = { ...baseProps, collection: { ...darColl } }
  vi.clearAllMocks()
  ;(Storage.getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ userId: 1, roles: [{ dacId: 2 }, {}, { dacId: 3 }] })
  ;(Navigation.console as ReturnType<typeof vi.fn>).mockResolvedValue({})
})

describe('Actions - Container', () => {
  it('renders the actions container div', () => {
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector('.chair-actions')).not.toBeNull()
  })
})

describe('Actions - Open Button', () => {
  it('should render the open button if there is an Open Action', () => {
    propCopy.actions = ['Open']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-open-${collectionId}`)).not.toBeNull()
  })

  it('should not render Open Button if there is no valid election for opening/re-opening', () => {
    propCopy.actions = []
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-open-${collectionId}`)).toBeNull()
  })
})

describe('Actions - Approve Button', () => {
  it('should render the approve button if there is an Approve Action', () => {
    propCopy.actions = ['Approve']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-approve-${collectionId}`)).not.toBeNull()
  })

  it('should not render Approve Button if there is no Approve Action', () => {
    propCopy.actions = []
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-approve-${collectionId}`)).toBeNull()
  })
})

describe('Actions - Close Button', () => {
  it('should render if there is a valid election for canceling (all open elections)', () => {
    propCopy.actions = ['Cancel', 'Vote']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-cancel-${collectionId}`)).not.toBeNull()
  })

  it('should not render if there is no valid election for canceling (no open elections)', () => {
    propCopy.actions = []
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-cancel-${collectionId}`)).toBeNull()
  })
})

describe('Actions - Vote Button', () => {
  it('should not render if relevant elections are not votable', () => {
    propCopy.actions = []
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-vote-${collectionId}`)).toBeNull()
  })

  it('should render if all relevant elections are votable', () => {
    propCopy.actions = ['Vote']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-vote-${collectionId}`)).not.toBeNull()
  })
})

describe('Actions - Update Button', () => {
  it('should not render if relevant elections are not votable', () => {
    propCopy.actions = []
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-update-${collectionId}`)).toBeNull()
  })

  it('should render if all relevant elections are votable', () => {
    propCopy.actions = ['Update']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#chair-update-${collectionId}`)).not.toBeNull()
  })
})

describe('Researcher Actions - Revise Button', () => {
  it('renders the revise button if the collection is revisable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Revise', 'Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-revise-${collectionId}`)).not.toBeNull()
  })

  it('does not render if the election is not revisable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-revise-${collectionId}`)).toBeNull()
  })
})

describe('Researcher Actions - Review Button', () => {
  it('renders the review button if the collection is reviewable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Revise', 'Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-review-${collectionId}`)).not.toBeNull()
  })

  it('does not render if the election is not reviewable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Revise']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-review-${collectionId}`)).toBeNull()
  })
})

describe('Researcher Actions - Resume Button', () => {
  it('renders the resume button if the collection is resumable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Resume', 'Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-resume-${collectionId}`)).not.toBeNull()
  })

  it('does not render if the election is not resumable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-resume-${collectionId}`)).toBeNull()
  })
})

describe('Researcher Actions - Delete Button', () => {
  it('renders the delete button if the collection is deletable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Delete', 'Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-delete-${collectionId}`)).not.toBeNull()
  })

  it('does not render if the election is not deletable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-delete-${collectionId}`)).toBeNull()
  })
})

describe('Researcher Actions - Draft', () => {
  it('uses the referenceId in id if draft', () => {
    propCopy.consoleType = 'researcher'
    propCopy.collection = { ...draftDarColl }
    propCopy.actions = ['Revise', 'Resume', 'Review', 'Cancel', 'Delete']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-delete-${collectionId}`)).toBeNull()
    expect(container.querySelector(`#researcher-resume-${refId1}`)).not.toBeNull()
    expect(container.querySelector(`#researcher-review-${refId1}`)).not.toBeNull()
    expect(container.querySelector(`#researcher-cancel-${refId1}`)).not.toBeNull()
    expect(container.querySelector(`#researcher-delete-${refId1}`)).not.toBeNull()
    expect(container.querySelector(`#researcher-revise-${refId1}`)).not.toBeNull()
  })
})

describe('Researcher Actions - Create Progress Report Button', () => {
  it('renders the update button if the collection is updatable', () => {
    ;(Storage.getEnv as ReturnType<typeof vi.fn>).mockReturnValue(EnvironmentUtils.envGroups.NON_PROD[0])
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Resume', 'Create_Progress_Report']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-create-progress-report-${collectionId}`)).not.toBeNull()
  })

  it('does not render if the collection is not updatable', () => {
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-create-progress-report-${collectionId}`)).toBeNull()
  })
})

describe('Researcher Actions - Review Closeout Button', () => {
  it('renders the review closeout button if the collection has Review_Progress_Report action', () => {
    ;(Storage.getEnv as ReturnType<typeof vi.fn>).mockReturnValue(EnvironmentUtils.envGroups.NON_PROD[0])
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review_Progress_Report']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-review-closeout-${collectionId}`)).not.toBeNull()
  })

  it('renders in production environment with Review_Progress_Report action', () => {
    ;(Storage.getEnv as ReturnType<typeof vi.fn>).mockReturnValue('prod')
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review_Progress_Report']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-review-closeout-${collectionId}`)).not.toBeNull()
  })

  it('does not render if Review_Progress_Report action is not present', () => {
    ;(Storage.getEnv as ReturnType<typeof vi.fn>).mockReturnValue(EnvironmentUtils.envGroups.NON_PROD[0])
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review']
    const { container } = render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(container.querySelector(`#researcher-review-closeout-${collectionId}`)).toBeNull()
  })

  it('renders with correct label "Review Closeout"', () => {
    ;(Storage.getEnv as ReturnType<typeof vi.fn>).mockReturnValue(EnvironmentUtils.envGroups.NON_PROD[0])
    propCopy.consoleType = 'researcher'
    propCopy.actions = ['Review_Progress_Report']
    render(<BrowserRouter><Actions {...propCopy} /></BrowserRouter>)
    expect(screen.getByText('Review Closeout')).toBeInTheDocument()
  })
})
