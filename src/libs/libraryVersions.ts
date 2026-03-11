import broadIcon from 'src/logo.svg'
import duosIcon from 'src/images/duos-network-logo.svg'
import mgbIcon from 'src/images/mass-general-brigham-logo.svg'
import elwaziIcon from 'src/images/elwazi-logo-color.svg'
import nhgriIcon from 'src/images/nhgri-logo-color.svg'
import nhlbiIcon from 'src/images/nhlbi-logo.svg'
import anvilIcon from 'src/images/anvil-logo.svg'
import terraIcon from 'src/images/terra-logo.svg'
import hcaIcon from 'src/images/human-cell-atlas-logo.png'
import ifgcIcon from 'src/images/IFGC-logo.png'
import cfdeIcon from 'src/images/cfde-logo.png'
import firecloudIcon from 'src/images/firecloud-logo.png'
import zoonomicsIcon from 'src/images/ZoonomicsLogoColor.png'
import aouIcon from 'src/images/aou-logo.png'
import scpIcon from 'src/images/scp_logo.png'
import schareIcon from 'src/images/SCHARE_Logo_New.png'
import stanleyIcon from 'src/images/stanley-center-logo.png'
import getzLabIcon from 'src/images/getz-lab-logo.svg'
import gp2Icon from 'src/images/gp2-logo.png'
import asapIcon from 'src/images/asap-logo.png'
import gedIcon from 'src/images/GED_logo.png'
import ncpiIcon from 'src/images/ncpi-logo.png'
import epi25Icon from 'src/images/Epi25_logo.png'
import PGCIcon from 'src/images/PGC_logo.jpg'
import PBNIcon from 'src/images/PBN_logo.jpg'
import HelmsleyIcon from 'src/images/Helmsley_logo.png'
import ccxdpIcon from 'src/images/ccxdp-logo.png'

interface MatchPhraseQuery {
  match_phrase: {
    [key: string]: string | number
  }
}

interface TermQuery {
  term: {
    [key: string]: string
  }
}

interface TermsQuery {
  terms: {
    [key: string]: string[]
  }
}

export interface BoolQuery {
  bool: {
    should: Array<MatchPhraseQuery | TermQuery | TermsQuery>
  }
}

type ElasticsearchQuery = MatchPhraseQuery | BoolQuery | null

export interface LibraryVersion {
  query: ElasticsearchQuery
  icon: string | null
  title: string
  featured: boolean
  order: number
}

export interface LibraryVersions {
  [key: string]: LibraryVersion
}

/**
 * Get library versions configuration
 * @param institutionId - The institution ID for the user
 * @param institutionName - The institution name for the user
 * @param customQuery - Custom query string for custom library version
 * @returns Library versions configuration object
 */
export const getLibraryVersions = (
  institutionId: number | null,
  institutionName: string | null,
): LibraryVersions => {
  return {
    '/datalibrary': {
      query: null,
      icon: duosIcon,
      title: 'DUOS Data Library',
      featured: true,
      order: 1,
    },
    'broad': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'submitter.institution.name': 'The Broad Institute of MIT and Harvard',
              },
            },
            {
              terms: {
                'study.data.tags': ['The Broad Institute of MIT and Harvard'],
              },
            },
          ],
        },
      },
      icon: broadIcon,
      title: 'Broad Data Library',
      featured: true,
      order: 2,
    },
    'mgb': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'submitter.institution.name': 'Massachusetts General Hospital',
              },
            },
            {
              match_phrase: {
                'submitter.institution.name': 'Brigham and Women\'s Hospital',
              },
            },
            {
              match_phrase: {
                'submitter.institution.name': 'Faulkner Hospital', // TODO: identify exact name
              },
            },
            {
              match_phrase: {
                'submitter.institution.name': 'Spaulding Hospital', // TODO: identify exact name
              },
            },
            {
              terms: {
                'study.data.tags': ['mgb', 'Massachusetts General Hospital', 'Brigham and Women\'s Hospital', 'Faulkner Hospital', 'Spaulding Hospital'],
              },
            },
          ],
        },
      },
      icon: mgbIcon,
      title: 'Mass General Brigham Data Library',
      featured: false,
      order: 999,
    },
    'elwazi': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'elwazi',
              },
            },
            {
              terms: {
                'study.data.tags': ['elwazi'],
              },
            },
          ],
        },
      },
      icon: elwaziIcon,
      title: 'eLwazi Data Library',
      featured: true,
      order: 3,
    },
    'myinstitution': {
      query: {
        match_phrase: {
          'submitter.institution.id': institutionId ?? 0,
        },
      },
      icon: null,
      title: (institutionName ?? '') + ' Data Library',
      featured: false,
      order: 999,
    },
    'nhgri': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'anvil',
              },
            },
            {
              terms: {
                'study.data.tags': ['anvil'],
              },
            },
          ],
        },
      },
      icon: nhgriIcon,
      title: 'NHGRI Data Library',
      featured: true,
      order: 4,
    },
    'nhlbi': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Data Library',
      featured: false,
      order: 999,
    },
    'scp': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'Single Cell Portal',
              },
            },
            {
              terms: {
                'study.data.tags': ['Platform: Single Cell Portal'],
              },
            },
          ],
        },
      },
      icon: scpIcon,
      title: 'Single Cell Portal Data Library',
      featured: true,
      order: 5,
    },
    'nhlbi-blood-disorders-and-blood-safety': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Blood Disorders and Blood Safety',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Blood Disorders and Blood Safety'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Blood Disorders and Blood Safety Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-health-disparities': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Health Disparities',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Health Disparities'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Health Disparities Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-heart-and-vascular-diseases': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Heart and Vascular Diseases',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Heart and Vascular Diseases'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Heart and Vascular Diseases Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-lung-diseases': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Lung Diseases',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Lung Diseases'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Lung Diseases Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-obesity-nutrition-and-physical-activity': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Obesity, Nutrition, and Physical Activity',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Obesity, Nutrition, and Physical Activity'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Obesity, Nutrition, and Physical Activity Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-population-and-epidemiology-studies': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Population and Epidemiology Studies',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Population and Epidemiology Studies'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Population and Epidemiology Studies Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-precision-medicine-activities': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Precision Medicine Activities',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Precision Medicine Activities'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Precision Medicine Activities Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-research-spectrum': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Research Spectrum',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Research Spectrum'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Research Spectrum Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-sleep-science-and-sleep-disorders': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Sleep Science and Sleep Disorders',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Sleep Science and Sleep Disorders'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Sleep Science and Sleep Disorders Data Library',
      featured: false,
      order: 999,
    },
    'nhlbi-womens-health': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NHLBI Women\'s Health',
              },
            },
            {
              terms: {
                'study.data.tags': ['NHLBI Women\'s Health'],
              },
            },
          ],
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Women\'s Health Data Library',
      featured: false,
      order: 999,
    },
    'anvil': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'anvil',
              },
            },
            {
              terms: {
                'study.data.tags': ['anvil'],
              },
            },
          ],
        },
      },
      icon: anvilIcon,
      title: 'AnVIL Data Library',
      featured: true,
      order: 6,
    },
    'hca': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'hca dcp',
              },
            },
            {
              terms: {
                'study.data.tags': ['hca dcp'],
              },
            },
          ],
        },
      },
      icon: hcaIcon,
      title: 'Human Cell Atlas Data Library',
      featured: true,
      order: 7,
    },
    'zoonomics': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'zoonomics',
              },
            },
            {
              terms: {
                'study.data.tags': ['zoonomics'],
              },
            },
          ],
        },
      },
      icon: zoonomicsIcon,
      title: 'Center for Zoonomics Data Library',
      featured: false,
      order: 999,
    },
    'terra': {
      query: null,
      icon: terraIcon,
      title: 'Terra Data Library',
      featured: false,
      order: 999,
    },
    'cfde': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'cfde',
              },
            },
            {
              terms: {
                'study.data.tags': ['cfde'],
              },
            },
          ],
        },
      },
      icon: cfdeIcon,
      title: 'CFDE Data Library',
      featured: false,
      order: 999,
    },
    'firecloud': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'FireCloud',
              },
            },
            {
              terms: {
                'study.data.tags': ['FireCloud'],
              },
            },
          ],
        },
      },
      icon: firecloudIcon,
      title: 'FireCloud Data Library',
      featured: false,
      order: 999,
    },
    'allofus': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'All of Us',
              },
            },
            {
              terms: {
                'study.data.tags': ['All of Us'],
              },
            },
          ],
        },
      },
      icon: aouIcon,
      title: 'All of Us Data Library',
      featured: false,
      order: 999,
    },
    'openaccess': {
      query: {
        bool: {
          should: [
            {
              term: {
                accessManagement: 'open',
              },
            },
          ],
        },
      },
      icon: duosIcon,
      title: 'DUOS Open Access Data Library',
      featured: false,
      order: 999,
    },
    'ifgc': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'International Fetal Genomics Consortium',
              },
            },
            {
              terms: {
                'study.data.tags': ['International Fetal Genomics Consortium'],
              },
            },
          ],
        },
      },
      icon: ifgcIcon,
      title: 'International Fetal Genomics Consortium Data Library',
      featured: true,
      order: 8,
    },
    'schare': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'SCHARE',
              },
            },
            {
              terms: {
                'study.data.tags': ['SCHARE'],
              },
            },
          ],
        },
      },
      icon: schareIcon,
      title: 'SCHARE Data Library',
      featured: true,
      order: 9,
    },
    'stanley': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'Stanley Center',
              },
            },
            {
              terms: {
                'study.data.tags': ['Stanley Center'],
              },
            },
          ],
        },
      },
      icon: stanleyIcon,
      title: 'Stanley Center Data Library',
      featured: false,
      order: 999,
    },
    'stanleycenter': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'Stanley Center',
              },
            },
            {
              terms: {
                'study.data.tags': ['Stanley Center'],
              },
            },
          ],
        },
      },
      icon: stanleyIcon,
      title: 'Stanley Center Data Library',
      featured: true,
      order: 10,
    },
    'getzlab': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'Getz Lab',
              },
            },
            {
              terms: {
                'study.data.tags': ['Getz Lab'],
              },
            },
          ],
        },
      },
      icon: getzLabIcon,
      title: 'Getz Lab Data Library',
      featured: false,
      order: 999,
    },
    'asap': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'ASAP',
              },
            },
            {
              terms: {
                'study.data.tags': ['ASAP'],
              },
            },
          ],
        },
      },
      icon: asapIcon,
      title: 'Aligning Science Across Parkinson\'s Data Library',
      featured: true,
      order: 11,
    },
    'gp2': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'GP2',
              },
            },
            {
              terms: {
                'study.data.tags': ['GP2'],
              },
            },
          ],
        },
      },
      icon: gp2Icon,
      title: 'Global Parkinson\'s Genetics Program Data Library',
      featured: true,
      order: 12,
    },
    'broadasd': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'ASD',
              },
            },
            {
              terms: {
                'study.data.tags': ['ASD'],
              },
            },
          ],
        },
      },
      icon: broadIcon,
      title: 'Broad Institute Autism Spectrum Disorder (ASD) Data Library',
      featured: true,
      order: 13,
    },
    'pbn': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'PBN',
              },
            },
            {
              terms: {
                'study.data.tags': ['PBN'],
              },
            },
          ],
        },
      },
      icon: PBNIcon,
      title: 'Psychiatric Biomarkers Network Data Library',
      featured: true,
      order: 14,
    },
    'pgc': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'PGC',
              },
            },
            {
              terms: {
                'study.data.tags': ['PGC'],
              },
            },
          ],
        },
      },
      icon: PGCIcon,
      title: 'Psychiatric Genomics Consortium - PsychChip Data Library',
      featured: true,
      order: 15,
    },
    'broadsczbd': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'SCZ',
              },
            },
            {
              terms: {
                'study.data.tags': ['SCZ'],
              },
            },
          ],
        },
      },
      icon: broadIcon,
      title: 'Broad Institute Schizophrenia & Bipolar Disorder Data Library',
      featured: true,
      order: 16,
    },
    'esp': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'ESP',
              },
            },
            {
              terms: {
                'study.data.tags': ['ESP'],
              },
            },
          ],
        },
      },
      icon: epi25Icon,
      title: 'Broad Institute Epilepsy Data Library',
      featured: true,
      order: 17,
    },
    'broadibd': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'IBD',
              },
            },
            {
              terms: {
                'study.data.tags': ['IBD'],
              },
            },
          ],
        },
      },
      icon: broadIcon,
      title: 'Broad Institute IBD Data Library',
      featured: true,
      order: 18,
    },
    'helmsley': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'Helmsley',
              },
            },
            {
              terms: {
                'study.data.tags': ['Helmsley'],
              },
            },
          ],
        },
      },
      icon: HelmsleyIcon,
      title: 'Helmsley Data Library',
      featured: true,
      order: 19,
    },
    'ged': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'Eating Disorder Sequencing Program',
              },
            },
            {
              terms: {
                'study.data.tags': ['Eating Disorder Sequencing Program'],
              },
            },
          ],
        },
      },
      icon: gedIcon,
      title: 'Genetics of Eating Disorders Data Library',
      featured: true,
      order: 20,
    },
    'ccxdp': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'CCXDP',
              },
            },
            {
              terms: {
                'study.data.tags': ['CCXDP'],
              },
            },
          ],
        },
      },
      icon: ccxdpIcon,
      title: 'CCXDP Data Library',
      featured: true,
      order: 21,
    },
    'ncpi-duo': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': 'NCPI DUO',
              },
            },
            {
              terms: {
                'study.data.tags': ['NCPI DUO'],
              },
            },
          ],
        },
      },
      icon: ncpiIcon,
      title: 'NCPI DUO Data Library',
      featured: true,
      order: 22,
    },
  }
}

export const getBrandedLibrary = (institutionId: number | undefined, institutionName: string | undefined, queryParam: string | undefined) => {
  const key = queryParam === undefined ? '/datalibrary' : queryParam.toLowerCase()
  const versions = getLibraryVersions(institutionId ?? null, institutionName ?? null)
  return versions[key]
}
