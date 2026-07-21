import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import { isNil } from 'src/utils/NodashUtil'
import { Styles } from 'src/libs/theme'
import { Storage } from 'src/libs/storage'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { headerTabsConfig } from 'src/components/DuosHeader'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { hasDataSubmitterRole, Notifications, USER_ROLES } from 'src/libs/utils'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DAA } from 'src/libs/ajax/DAA'
import { buildResearcherRows } from 'src/pages/signing_official_console/DAAAssignment'
import { getBrandedLibrary } from 'src/libs/libraryVersions'
import { buildElasticsearchQuery } from 'src/hooks/useLibraryData'
import { assetRegistry } from 'src/components/data_library/assets'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'
import { AssetType, LibraryVersionNew } from 'src/types/library'
import { DAAObject } from 'src/types/model'
import { extractError } from 'src/utils/ErrorUtils'

interface TileMeta {
  icon: React.ComponentType
  description: string
  statLabels: string[]
}

const tileMetaByLink: Record<string, TileMeta> = {
  '/signing_official_console/library_cards': {
    icon: PeopleAltOutlinedIcon,
    description: 'Manage researchers who request data on behalf of your institution.',
    statLabels: ['Active', 'Inactive'],
  },
  '/signing_official_console/dar_requests': {
    icon: DescriptionOutlinedIcon,
    description: 'Review data access requests submitted by researchers at your institution.',
    statLabels: ['Total', 'Approved', 'Denied', 'Pending'],
  },
  '/signing_official_console/dar_approvals': {
    icon: FactCheckOutlinedIcon,
    description: 'Approve or reject data access request applications awaiting your signature.',
    statLabels: ['Total', 'Awaiting SO Action'],
  },
  '/signing_official_console/data_submitters': {
    icon: GroupOutlinedIcon,
    description: 'Manage the researchers who submit data on behalf of your institution.',
    statLabels: ['Approved'],
  },
  '/datalibrary/myinstitution': {
    icon: StorageOutlinedIcon,
    description: 'Browse the datasets and studies registered by your institution.',
    statLabels: ['Datasets', 'Studies'],
  },
  '/signing_official_console/researchers_daa_associations': {
    icon: HandshakeOutlinedIcon,
    description: 'Manage Data Access Agreement associations for your researchers.',
    statLabels: ['Agreements', 'Researchers Approved'],
  },
}

interface HelpfulResource {
  icon: React.ComponentType
  label: string
  description: string
  href: string
}

const helpfulResources: HelpfulResource[] = [
  {
    icon: MenuBookOutlinedIcon,
    label: 'Signing Official Guide',
    description: 'A walkthrough of the Signing Official role, from pre-authorizing researchers to issuing library cards.',
    href: 'https://duos.blog/help/preauthorize_researchers_librarycards/',
  },
  {
    icon: QuizOutlinedIcon,
    label: 'Frequently Asked Questions',
    description: 'Answers to common questions about using DUOS.',
    href: 'https://duos.blog/help/faqs/',
  },
  {
    icon: ArticleOutlinedIcon,
    label: 'Help Center',
    description: 'Browse the full library of DUOS documentation and how-to articles.',
    href: 'https://duos.blog/help/',
  },
]

// Some DAAs aren't mapped to any DAC and aren't selectable for pre-authorization;
// mirrors the filtering in ManageResearcherDAAs.tsx so the counts match that page.
const filterAssignableDaas = (daas: Array<DAAObject & { broadDaa?: boolean }>): DAAObject[] =>
  daas.filter((daa) => {
    const hasMappedDac = Array.isArray(daa.dacs) && daa.dacs.length > 0
    return Boolean(daa.broadDaa) || hasMappedDac
  })

interface InstitutionLibraryTotals {
  datasetTotal: number
  studyTotal: number
}

const fetchInstitutionLibraryTotals = async (institutionId?: number, institutionName?: string): Promise<InstitutionLibraryTotals | undefined> => {
  if (isNil(institutionId)) {
    return undefined
  }
  const brand = getBrandedLibrary(institutionId, institutionName, 'myinstitution')
  const libraryConfig: LibraryVersionNew = {
    key: 'myinstitution',
    query: brand?.query,
    icon: brand?.icon || undefined,
    title: brand?.title ?? 'My Institution\'s Data Library',
    featured: brand?.featured ?? false,
    order: brand?.order ?? 999,
    restrictToPublicVisibility: false,
  }
  const datasetPagination = { page: 0, pageSize: 0 }
  // Studies use a composite aggregation whose `size` is derived from pagination and must be >= 1,
  // unlike the plain hit-count query datasets use — a pageSize of 0 here is rejected by Elasticsearch.
  const studyPagination = { page: 0, pageSize: 1 }
  const [datasetResponse, studyResponse] = await Promise.all([
    DataSet.searchDatasetIndexV2(buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, EMPTY_FILTERS, '', datasetPagination)),
    DataSet.searchDatasetIndexV2(buildElasticsearchQuery(libraryConfig, AssetType.STUDIES, EMPTY_FILTERS, '', studyPagination)),
  ])
  return {
    datasetTotal: datasetResponse.total,
    studyTotal: assetRegistry[AssetType.STUDIES].transformResponse(studyResponse, studyPagination).total,
  }
}

export default function SigningOfficialDashboard(): React.JSX.Element {
  usePageTitle('Dashboard')
  const location = useLocation()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showContactModal, setShowContactModal] = useState<boolean>(false)
  const [statValuesByLink, setStatValuesByLink] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const currentUser = Storage.getCurrentUser()

        const [researchers, collections, libraryTotals, daas] = await Promise.all([
          User.list(USER_ROLES.signingOfficial),
          Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial),
          fetchInstitutionLibraryTotals(currentUser?.institution?.id, currentUser?.institution?.name),
          DAA.getDaas(),
        ])
        const assignableDaas = filterAssignableDaas(daas)
        const approvedResearcherCount = buildResearcherRows(researchers, assignableDaas)
          .filter(row => row.authorizedCount > 0).length

        const activeResearcherCount = researchers.filter(researcher => !isNil(researcher.libraryCard)).length
        const inactiveResearcherCount = researchers.length - activeResearcherCount

        const approvedDarCount = collections.filter(collection => collection.status === 'Complete').length
        const deniedDarCount = collections.filter(collection => collection.status === 'Canceled').length
        const pendingDarCount = collections.length - approvedDarCount - deniedDarCount

        const totalApprovalsCount = collections.filter(collection =>
          collection.requiresSOApproval || collection.actions.includes('Review_Progress_Report')).length
        const awaitingSOActionCount = collections.filter(collection => collection.actions.includes('Approve')).length

        const approvedDataSubmitterCount = researchers.filter(hasDataSubmitterRole).length

        setStatValuesByLink({
          '/signing_official_console/library_cards': {
            Active: activeResearcherCount,
            Inactive: inactiveResearcherCount,
          },
          '/signing_official_console/dar_requests': {
            Total: collections.length,
            Approved: approvedDarCount,
            Denied: deniedDarCount,
            Pending: pendingDarCount,
          },
          '/signing_official_console/dar_approvals': {
            'Total': totalApprovalsCount,
            'Awaiting SO Action': awaitingSOActionCount,
          },
          '/signing_official_console/data_submitters': {
            Approved: approvedDataSubmitterCount,
          },
          '/signing_official_console/researchers_daa_associations': {
            'Agreements': assignableDaas.length,
            'Researchers Approved': approvedResearcherCount,
          },
          ...(!isNil(libraryTotals) && {
            '/datalibrary/myinstitution': {
              Datasets: libraryTotals.datasetTotal,
              Studies: libraryTotals.studyTotal,
            },
          }),
        })
        setIsLoading(false)
      }
      catch (error) {
        const message = extractError(error)
        Notifications.showError({ text: `Error: Unable to load dashboard statistics: ${message}` })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const soConsoleTab = headerTabsConfig.find(tab => tab.label === 'SO Console')
  const tiles = (soConsoleTab?.children ?? []).filter(child => child.label !== 'Dashboard')

  return (
    <div style={Styles.PAGE}>
      <style>
        {`
        .so-dashboard-title {
          font-family: Montserrat, sans-serif;
          font-weight: 600;
          font-size: 2.8rem;
          color: #1F3B50;
          max-width: 900px;
          margin: 2rem auto 0;
        }
        .so-dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.5rem;
          max-width: 900px;
          margin: 2rem auto;
        }
        .so-dashboard-tile {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 1.75rem;
          box-sizing: border-box;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .so-dashboard-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.13);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .so-dashboard-tile-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0, 96, 159, 0.08);
          color: #00609f;
          flex-shrink: 0;
        }
        .so-dashboard-tile-label {
          font-family: Montserrat, sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #1F3B50;
          margin: 0 0 0.35rem;
        }
        .so-dashboard-tile-description {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
        .so-dashboard-tile-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-top: 1rem;
        }
        .so-dashboard-stat {
          display: flex;
          flex-direction: column;
        }
        .so-dashboard-stat-value {
          font-family: Montserrat, sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #00609f;
        }
        .so-dashboard-stat-label {
          font-family: Montserrat, sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .so-dashboard-section-heading {
          font-family: Montserrat, sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #1F3B50;
          max-width: 900px;
          margin: 3rem auto 1rem;
        }
        .so-dashboard-resource-link {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          box-sizing: border-box;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .so-dashboard-resource-link:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.13);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .so-dashboard-resource-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: Montserrat, sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1F3B50;
          margin: 0 0 0.3rem;
        }
        .so-dashboard-resource-label svg {
          font-size: 16px;
          color: #9ca3af;
        }
        .so-dashboard-resource-description {
          font-family: Montserrat, sans-serif;
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
        .so-dashboard-promo {
          max-width: 900px;
          margin: 1.5rem auto 2rem;
          background: #1F3B50;
          border-radius: 12px;
          padding: 2rem 2.25rem;
          box-sizing: border-box;
        }
        .so-dashboard-promo-heading {
          font-family: Montserrat, sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.75rem;
        }
        .so-dashboard-promo-text {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          color: #d7e2ea;
          line-height: 1.6;
          margin: 0 0 0.75rem;
        }
        .so-dashboard-promo-button {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #1F3B50;
          background: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 10px 22px;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        @media (max-width: 600px) {
          .so-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>
      <h1 className="so-dashboard-title">Signing Official Console</h1>
      <div className="so-dashboard-grid">
        {tiles.map((tile) => {
          const meta = tileMetaByLink[tile.link]
          const Icon = meta?.icon
          const statLabels = meta?.statLabels ?? []
          const values = statValuesByLink[tile.link] ?? {}
          return (
            <Link key={tile.link} to={tile.link} className="so-dashboard-tile">
              {Icon && (
                <span className="so-dashboard-tile-icon-wrap">
                  <Icon />
                </span>
              )}
              <span>
                <p className="so-dashboard-tile-label">{tile.label}</p>
                {meta?.description && (
                  <p className="so-dashboard-tile-description">{meta.description}</p>
                )}
                {statLabels.length > 0 && (
                  <div className="so-dashboard-tile-stats">
                    {statLabels.map(label => (
                      <div key={label} className="so-dashboard-stat">
                        <span className="so-dashboard-stat-value">{isLoading ? '–' : (values[label] ?? '–')}</span>
                        <span className="so-dashboard-stat-label">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </span>
            </Link>
          )
        })}
      </div>

      <h2 className="so-dashboard-section-heading">Helpful Resources for Signing Officials</h2>
      <div className="so-dashboard-grid">
        {helpfulResources.map((resource) => {
          const Icon = resource.icon
          return (
            <a
              key={resource.href}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="so-dashboard-resource-link"
            >
              <span className="so-dashboard-tile-icon-wrap">
                <Icon />
              </span>
              <span>
                <p className="so-dashboard-resource-label">
                  {resource.label}
                  <OpenInNewOutlinedIcon />
                </p>
                <p className="so-dashboard-resource-description">{resource.description}</p>
              </span>
            </a>
          )
        })}
      </div>

      <div className="so-dashboard-promo">
        <p className="so-dashboard-promo-heading">Get more out of DUOS</p>
        <p className="so-dashboard-promo-text">
          Signing Officials can use DUOS to curate and share their institution&#39;s datasets with the
          research community. You can also leverage DUOS alongside Terra to meet NIH requirements
          for analyzing and storing controlled-access data.
        </p>
        <p className="so-dashboard-promo-text">
          Reach out if you&#39;d like to learn more about either of these.
        </p>
        <button
          type="button"
          className="so-dashboard-promo-button"
          onClick={() => setShowContactModal(true)}
        >
          Contact Us
        </button>
      </div>

      <SupportRequestModal
        showModal={showContactModal}
        onCloseRequest={() => setShowContactModal(false)}
        url={location.pathname}
      />
    </div>
  )
}
