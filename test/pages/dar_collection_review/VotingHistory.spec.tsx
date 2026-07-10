import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VotingHistory from 'src/pages/dar_collection_review/VotingHistory'
import { DarCollection } from 'src/types/model'
import { VOTE_TYPES } from 'src/utils/DarUtils'

const darCollection: DarCollection = {
  darCollectionId: 1234,
  darCode: 'DAR-XXX',
  createDate: 1669229413840,
  createUserId: 7,
  dars: {
    'dars-id-123': {
      id: 2147,
      referenceId: 'dars-id-123',
      collectionId: 777,
      data: {
        projectTitle: 'string',
        checkNihDataOnly: false,
        rus: 'string',
        nonTechRus: 'string',
        diseases: false,
        methods: false,
        aiLlmUse: false,
        controls: false,
        population: false,
        other: false,
        otherText: 'string',
        ontologies: [],
        forProfit: false,
        oneGender: false,
        gender: 'string',
        pediatric: false,
        illegalBehavior: false,
        addiction: false,
        sexualDiseases: false,
        stigmatizedDiseases: false,
        vulnerablePopulation: false,
        populationMigration: false,
        psychiatricTraits: false,
        notHealth: false,
        hmb: false,
        status: 'string',
        poa: false,
        datasets: [],
        restriction: {},
        validRestriction: false,
        progressReportSummary: 'string',
        intellectualPropertySummary: 'string',
        publications: [],
        presentations: [],
        researchPlans: 'string',
        anvilUse: false,
        cloudUse: false,
        localUse: false,
        cloudProvider: 'string',
        cloudProviderType: 'string',
        cloudProviderDescription: 'string',
        geneticStudiesOnly: false,
        irb: false,
        itDirector: 'string',
        itDirectorEmail: 'string',
        signingOfficial: 'string',
        signingOfficialEmail: 'string',
        publication: false,
        collaboration: false,
        forensicActivities: false,
        sharingDistribution: false,
        labCollaborators: [],
        internalCollaborators: [],
        externalCollaborators: [],
        dsAcknowledgement: false,
        gsoAcknowledgement: false,
        pubAcknowledgement: false,
        piName: 'string',
        piEmail: 'string',
        piCountryOfOperation: 'string',
      },
      progressReport: true,
      expired: false,
      expiresAt: 111111,
      eraCommonsId: 'HERMAN',
      draft: false,
      userId: 7,
      createDate: 1667970929000,
      submissionDate: 1669229413840,
      updateDate: 1669229413840,
      datasetIds: [13, 14],
      elections: {
        8888: {
          electionId: 8888,
          electionType: 'DataAccess',
          status: 'Open',
          createDate: new Date('2022-11-21T10:30:00-05:00').getTime(),
          lastUpdate: new Date('2022-11-21T10:30:00-05:00').getTime(),
          referenceId: 'dars-id-123',
          datasetId: 13,
          displayId: 'E-8888',
          dulName: 'Data Use Limitation',
          version: 1,
          archived: false,
          votes: {
            8675: { voteId: 8675, vote: true, userId: 4444, createDate: 1669062648000, updateDate: 1669120753000, electionId: 8888, rationale: '', type: 'DAC', displayName: 'Beth Johnson' },
            8676: { voteId: 8676, userId: 11111, createDate: 1669062648000, electionId: 8888, type: 'DAC', displayName: 'DAC Member 1' },
            8677: { voteId: 8677, userId: 11111, createDate: 1669062648000, electionId: 8888, type: 'Chairperson', displayName: 'Ted Lasso' },
            8678: { voteId: 8678, userId: 11111, createDate: 1669062648000, electionId: 8888, type: VOTE_TYPES.FINAL, displayName: 'Ted Lasso' },
            8679: { voteId: 8679, userId: 11111, createDate: 1669062648000, electionId: 8888, type: 'AGREEMENT', displayName: 'Ted Lasso' },
            8680: { voteId: 8680, userId: 9988, createDate: 1669062648000, electionId: 8888, type: 'DAC', displayName: 'DAC Member 2' },
            8681: { voteId: 8681, userId: 9988, createDate: 1669062648000, electionId: 8888, updateDate: 1669120753000, vote: true, rationale: '', type: 'Chairperson', displayName: 'Stuart Williams' },
            8682: { voteId: 8682, userId: 9988, createDate: 1669062648000, electionId: 8888, updateDate: 1669120753000, vote: true, rationale: '', type: VOTE_TYPES.FINAL, displayName: 'Stuart Williams' },
            8683: { voteId: 8683, userId: 9988, createDate: 1669062648000, electionId: 8888, updateDate: 1669120753000, vote: true, rationale: '', type: 'AGREEMENT', displayName: 'Stuart Williams' },
            8684: { voteId: 8684, userId: 4585, createDate: 1669062648000, electionId: 8888, updateDate: 1669120753000, vote: true, rationale: '', type: VOTE_TYPES.RADAR_APPROVE, displayName: 'Sue Smith' },
          },
        },
        1776: {
          electionId: 1776,
          electionType: 'RP',
          status: 'Open',
          createDate: new Date('2023-01-10T10:30:00-05:00').getTime(),
          lastUpdate: new Date('2022-11-21T10:30:00-05:00').getTime(),
          referenceId: 'dars-id-123',
          datasetId: 13,
          displayId: 'E-1776',
          dulName: 'Data Use Limitation',
          version: 1,
          archived: false,
          votes: {
            8685: { voteId: 8685, userId: 4444, createDate: 1669062648000, electionId: 1776, type: 'DAC', displayName: 'Beth Johnson' },
            8686: { voteId: 8686, userId: 11111, createDate: 1669062648000, electionId: 1776, type: 'DAC', displayName: 'Ted Lasso' },
            8688: { voteId: 8688, userId: 9988, createDate: 1669062648000, electionId: 1776, type: 'DAC', displayName: 'Stuart Williams' },
            8689: { voteId: 8689, userId: 9988, createDate: 1669062648000, electionId: 1776, type: 'Chairperson', displayName: 'Stuart Williams' },
            8690: { voteId: 8690, userId: 4585, createDate: 1669062648000, electionId: 1776, type: 'DAC', displayName: 'Sue Smtih' },
          },
        },
        8889: {
          electionId: 8889,
          electionType: 'DataAccess',
          status: 'Open',
          createDate: new Date('2023-01-03T10:30:00-05:00').getTime(),
          lastUpdate: new Date('2022-11-21T10:30:00-05:00').getTime(),
          referenceId: 'dars-id-123',
          datasetId: 14,
          displayId: 'E-8889',
          dulName: 'Data Use Limitation',
          version: 1,
          archived: false,
          votes: {
            86751: { voteId: 86751, vote: true, userId: 10, createDate: 1669062648000, updateDate: 1669120753000, electionId: 8889, rationale: '', type: 'DAC', displayName: 'DAC 2 Member 1' },
            86761: { voteId: 86761, userId: 11, createDate: 1669062648000, electionId: 8889, type: 'DAC', displayName: 'DAC 2 Member 2' },
            86771: { voteId: 86771, userId: 11, createDate: 1669062648000, electionId: 8889, type: 'Chairperson', displayName: 'Ted Lasso' },
            86781: { voteId: 86781, userId: 11, createDate: 1669062648000, electionId: 8889, type: VOTE_TYPES.FINAL, displayName: 'Ted Lasso' },
            86791: { voteId: 86791, userId: 11, createDate: 1669062648000, electionId: 8889, type: 'AGREEMENT', displayName: 'Ted Lasso' },
            86801: { voteId: 8680, userId: 9, createDate: 1669062648000, electionId: 8889, type: 'DAC', displayName: 'Stuart Williams' },
            86811: { voteId: 86811, userId: 9, createDate: 1669062648000, electionId: 8889, type: 'Chairperson', displayName: 'Stuart Williams' },
            86821: { voteId: 86821, userId: 9, createDate: 1669062648000, electionId: 8889, updateDate: 1669120753000, vote: true, rationale: '', type: VOTE_TYPES.FINAL, displayName: 'Stuart Williams' },
            86831: { voteId: 86831, userId: 9, createDate: 1669062648000, electionId: 8889, updateDate: 1669120753000, vote: true, rationale: '', type: 'AGREEMENT', displayName: 'Stuart Williams' },
            86841: { voteId: 86841, userId: 4, createDate: 1669062648000, electionId: 8889, type: 'DAC', displayName: 'Sue Smtih' },
          },
        },
      },
    },
  },
  datasets: [
    {
      datasetId: 13,
      name: 'Sleep Apnea',
      datasetName: 'Sleep Apnea',
      createDate: new Date(1567123200000),
      createUser: { userId: 100, createDate: new Date(1111), displayName: '', email: '', emailPreference: false, isAdmin: false, isAlumni: false, isChairPerson: false, isDataSubmitter: false, isMember: false, isResearcher: false, isSigningOfficial: false, roles: [] },
      createUserId: 100,
      alias: 999,
      datasetIdentifier: 'DUOS-00999',
      dataUse: {},
      dacId: 1,
      translatedDataUse: '',
      deletable: false,
      properties: [],
      dacApproval: true,
      study: { piName: 'Lisa Simpson, Betty White', studyId: 0, name: '', description: '', dataTypes: [], publicVisibility: false, datasetIds: [], datasets: [], properties: [], createDate: '', createUserId: 0 },
    },
    {
      datasetId: 14,
      name: 'Sleep Apnea 2',
      datasetName: 'Sleep Apnea 2',
      createDate: new Date(1567123200000),
      createUser: { userId: 100, createDate: new Date(1111), displayName: '', email: '', emailPreference: false, isAdmin: false, isAlumni: false, isChairPerson: false, isDataSubmitter: false, isMember: false, isResearcher: false, isSigningOfficial: false, roles: [] },
      createUserId: 100,
      alias: 999,
      datasetIdentifier: 'DUOS-00998',
      dataUse: {},
      dacId: 2,
      translatedDataUse: '',
      deletable: false,
      properties: [],
      dacApproval: true,
      study: { piName: 'Lisa Simpson, Betty White', studyId: 0, name: '', description: '', dataTypes: [], publicVisibility: false, datasetIds: [], datasets: [], properties: [], createDate: '', createUserId: 0 },
    },
  ],
}

const dacIds: number[] = [1]

describe('VotingHistory', () => {
  it('renders with correct headers', () => {
    render(<VotingHistory darCollection={darCollection} dacIds={dacIds} />)
    expect(screen.getByText('Votes')).toBeInTheDocument()
    expect(screen.getByText('Chair Votes')).toBeInTheDocument()
    expect(screen.getByText('Member Votes')).toBeInTheDocument()
  })

  it('renders with correct elections and votes filtered by DAC IDs and election type', async () => {
    const user = userEvent.setup()
    const { container } = render(<VotingHistory darCollection={darCollection} dacIds={dacIds} />)

    const tables = container.querySelectorAll('.table-data')
    const chairTable = tables[0] as HTMLElement
    const memberTable = tables[1] as HTMLElement

    // chair table shows election for datasetId 13 (dacId 1), not datasetId 14 (dacId 2)
    // date appears in multiple rows (per-vote rows), so use getAllByText
    expect(within(chairTable).getAllByText('2022-11-21').length).toBeGreaterThan(0)
    expect(within(chairTable).queryByText('2023-01-03')).not.toBeInTheDocument()

    // RP election (created 2023-01-10) is excluded; DataAccess election (2022-11-21) is included
    expect(within(chairTable).queryByText('2023-01-10')).not.toBeInTheDocument()

    // chair table positive: FINAL and RADAR_APPROVE vote-type strings appear in the Vote Type column
    expect(within(chairTable).getByText('FINAL')).toBeInTheDocument()
    expect(within(chairTable).getByText('RADAR_APPROVE')).toBeInTheDocument()
    // Sue Smith has a RADAR_APPROVE vote (vote 8684) — positive RADAR_APPROVE case
    expect(within(chairTable).getByText('Sue Smith')).toBeInTheDocument()
    // chair table includes only FINAL/RADAR_APPROVE votes with a vote value
    expect(within(chairTable).getByText('Stuart Williams')).toBeInTheDocument()
    expect(within(chairTable).queryByText('Ted Lasso')).not.toBeInTheDocument()
    // chair table negative: DAC, AGREEMENT, Chairperson vote types must be excluded
    expect(within(chairTable).queryByText('DAC')).not.toBeInTheDocument()
    expect(within(chairTable).queryByText('AGREEMENT')).not.toBeInTheDocument()
    expect(within(chairTable).queryByText('Chairperson')).not.toBeInTheDocument()

    // member table shows election for datasetId 13 (DataAccess)
    expect(within(memberTable).getAllByText('2022-11-21').length).toBeGreaterThan(0)
    expect(within(memberTable).queryByText('2023-01-03')).not.toBeInTheDocument()
    // RP election (2023-01-10) excluded from member table too, not just chair table
    expect(within(memberTable).queryByText('2023-01-10')).not.toBeInTheDocument()

    // expand the first row to see member vote names
    await user.click(within(memberTable).getByTestId('ExpandMoreIcon'))
    await waitFor(() => expect(within(memberTable).getByText('Beth Johnson')).toBeInTheDocument())

    expect(within(memberTable).getByText('DAC Member 1')).toBeInTheDocument()
    expect(within(memberTable).getByText('DAC Member 2')).toBeInTheDocument()
    expect(within(memberTable).queryByText('Ted Lasso')).not.toBeInTheDocument()
    expect(within(memberTable).queryByText('Sue Smith')).not.toBeInTheDocument()
    // userId 9988 has both a DAC vote (displayName='DAC Member 2') and a Chairperson
    // vote (displayName='Stuart Williams') in election 8888; DAC-only filter must
    // pick the DAC record and exclude the Chairperson record
    expect(within(memberTable).queryByText('Stuart Williams')).not.toBeInTheDocument()
  })
})
