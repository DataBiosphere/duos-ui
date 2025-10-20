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
import gp2Icon from 'src/images/gp2-logo.svg'
import asapIcon from 'src/images/asap-logo.svg'
import gedIcon from 'src/images/ged-logo.png'
import ncpiIcon from 'src/images/ncpi-logo.png'
import homeIcon from 'src/images/icon_dataset_.png'

/**
 * Get library versions configuration
 * @param {string} institutionId - The institution ID for the user
 * @param {string} institutionName - The institution name for the user
 * @param {string} customQuery - Custom query string for custom library version
 * @returns {Object} Library versions configuration object
 */
export const getLibraryVersions = (institutionId, institutionName, customQuery) => {
  return {
    '/datalibrary': {
      query: null,
      icon: duosIcon,
      title: 'DUOS Data Library',
      featured: false,
    },
    'broad': {
      query: {
        match_phrase: {
          'submitter.institution.name': 'The Broad Institute of MIT and Harvard',
        },
      },
      icon: broadIcon,
      title: 'Broad Data Library',
      featured: true,
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
          ],
        },
      },
      icon: mgbIcon,
      title: 'Mass General Brigham Data Library',
      featured: false,
    },
    'elwazi': {
      query: {
        match_phrase: {
          'study.description': 'elwazi',
        },
      },
      icon: elwaziIcon,
      title: 'eLwazi Data Library',
      featured: false,
    },
    'myinstitution': {
      query: {
        match_phrase: {
          'submitter.institution.id': institutionId,
        },
      },
      icon: null,
      title: institutionName + ' Data Library',
      featured: false,
    },
    'nhgri': {
      query: {
        match_phrase: {
          'study.description': 'anvil',
        },
      },
      icon: nhgriIcon,
      title: 'NHGRI Data Library',
      featured: false,
    },
    'nhlbi': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Data Library',
      featured: false,
    },
    'scp': {
      query: {
        match_phrase: {
          'study.description': 'Single Cell Portal',
        },
      },
      icon: scpIcon,
      title: 'Single Cell Portal Data Library',
      featured: true,
    },
    'nhlbi-blood-disorders-and-blood-safety': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Blood Disorders and Blood Safety',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Blood Disorders and Blood Safety Data Library',
      featured: false,
    },
    'nhlbi-health-disparities': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Health Disparities',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Health Disparities Data Library',
      featured: false,
    },
    'nhlbi-heart-and-vascular-diseases': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Heart and Vascular Diseases',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Heart and Vascular Diseases Data Library',
      featured: false,
    },
    'nhlbi-lung-diseases': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Lung Diseases',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Lung Diseases Data Library',
      featured: false,
    },
    'nhlbi-obesity-nutrition-and-physical-activity': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Obesity, Nutrition, and Physical Activity',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Obesity, Nutrition, and Physical Activity Data Library',
      featured: false,
    },
    'nhlbi-population-and-epidemiology-studies': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Population and Epidemiology Studies',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Population and Epidemiology Studies Data Library',
      featured: false,
    },
    'nhlbi-precision-medicine-activities': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Precision Medicine Activities',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Precision Medicine Activities Data Library',
      featured: false,
    },
    'nhlbi-research-spectrum': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Research Spectrum',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Research Spectrum Data Library',
      featured: false,
    },
    'nhlbi-sleep-science-and-sleep-disorders': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Sleep Science and Sleep Disorders',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Sleep Science and Sleep Disorders Data Library',
      featured: false,
    },
    'nhlbi-womens-health': {
      query: {
        match_phrase: {
          'study.description': 'NHLBI Women\'s Health',
        },
      },
      icon: nhlbiIcon,
      title: 'NHLBI Women\'s Health Data Library',
      featured: false,
    },
    'anvil': {
      query: {
        match_phrase: {
          'study.description': 'anvil',
        },
      },
      icon: anvilIcon,
      title: 'AnVIL Data Library',
      featured: true,
    },
    'hca': {
      query: {
        match_phrase: {
          'study.description': 'hca dcp',
        },
      },
      icon: hcaIcon,
      title: 'Human Cell Atlas Data Library',
      featured: true,
    },
    'zoonomics': {
      query: {
        match_phrase: {
          'study.description': 'zoonomics',
        },
      },
      icon: zoonomicsIcon,
      title: 'Center for Zoonomics Data Library',
      featured: false,
    },
    'terra': {
      query: null,
      icon: terraIcon,
      title: 'Terra Data Library',
      featured: false,
    },
    'cfde': {
      query: {
        match_phrase: {
          'study.description': 'cfde',
        },
      },
      icon: cfdeIcon,
      title: 'CFDE Data Library',
      featured: false,
    },
    'firecloud': {
      query: {
        match_phrase: {
          'study.description': 'FireCloud',
        },
      },
      icon: firecloudIcon,
      title: 'FireCloud Data Library',
      featured: false,
    },
    'allofus': {
      query: {
        match_phrase: {
          'study.description': 'All of Us',
        },
      },
      icon: aouIcon,
      title: 'All of Us Data Library',
      featured: false,
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
    },
    'ifgc': {
      query: {
        match_phrase: {
          'study.description': 'International Fetal Genomics Consortium',
        },
      },
      icon: ifgcIcon,
      title: 'International Fetal Genomics Consortium Data Library',
      featured: false,
    },
    'schare': {
      query: {
        match_phrase: {
          'study.description': 'SCHARE',
        },
      },
      icon: schareIcon,
      title: 'SCHARE Data Library',
      featured: false,
    },
    'stanley': {
      query: {
        match_phrase: {
          'study.description': 'Stanley Center',
        },
      },
      icon: stanleyIcon,
      title: 'Stanley Center Data Library',
      featured: false,
    },
    'stanleycenter': {
      query: {
        match_phrase: {
          'study.description': 'Stanley Center',
        },
      },
      icon: stanleyIcon,
      title: 'Stanley Center Data Library',
      featured: false,
    },
    'getzlab': {
      query: {
        match_phrase: {
          'study.description': 'Getz Lab',
        },
      },
      icon: getzLabIcon,
      title: 'Getz Lab Data Library',
      featured: false,
    },
    'asap': {
      query: {
        match_phrase: {
          'study.description': 'ASAP',
        },
      },
      icon: asapIcon,
      title: 'Aligning Science Across Parkinson\'s Data Library',
      featured: false,
    },
    'gp2': {
      query: {
        match_phrase: {
          'study.description': 'GP2',
        },
      },
      icon: gp2Icon,
      title: 'Global Parkinson\'s Genetics Program Data Library',
      featured: false,
    },
    'broadasd': {
      query: {
        match_phrase: {
          'study.description': 'ASD',
        },
      },
      icon: broadIcon,
      title: 'Broad Institute Autism Spectrum Disorder (ASD) Data Library',
      featured: false,
    },
    'pbn': {
      query: {
        match_phrase: {
          'study.description': 'PBN',
        },
      },
      icon: broadIcon,
      title: 'Psychiatric Biomarkers Network Data Library',
      featured: false,
    },
    'pgc': {
      query: {
        match_phrase: {
          'study.description': 'PGC',
        },
      },
      icon: broadIcon,
      title: 'Psychiatric Genomics Consortium - PsychChip Data Library',
      featured: false,
    },
    'broadsczbd': {
      query: {
        match_phrase: {
          'study.description': 'SCZ',
        },
      },
      icon: broadIcon,
      title: 'Broad Institute Schizophrenia & Bipolar Disorder Data Library',
      featured: false,
    },
    'esp': {
      query: {
        match_phrase: {
          'study.description': 'ESP',
        },
      },
      icon: broadIcon,
      title: 'Broad Institute Epilepsy Data Library',
      featured: false,
    },
    'fgc': {
      query: {
        match_phrase: {
          'study.description': 'FGC',
        },
      },
      icon: broadIcon,
      title: 'Fetal Genomics Consortium Data Library',
      featured: false,
    },
    'broadibd': {
      query: {
        match_phrase: {
          'study.description': 'IBD',
        },
      },
      icon: broadIcon,
      title: 'Broad Institute IBD Data Library',
      featured: false,
    },
    'ged': {
      query: {
        match_phrase: {
          'study.description': 'Eating Disorder Sequencing Program',
        },
      },
      icon: gedIcon,
      title: 'Genetics of Eating Disorders Data Library',
      featured: false,
    },
    'ncpi-duo': {
      query: {
        match_phrase: {
          'study.description': 'NCPI DUO',
        },
      },
      icon: ncpiIcon,
      title: 'NCPI DUO Data Library',
      featured: false,
    },
    '/custom': {
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                'study.description': customQuery,
              },
            },
            {
              match_phrase: {
                'submitter.institution.name': customQuery,
              },
            },
          ],
        },
      },
      icon: homeIcon,
      title: customQuery + ' Data Library',
      featured: false,
    },
  }
}
