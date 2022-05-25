export const Models = {
  dac: {
    dacId: null,
    name: '',
    description: '',
    createDate: null,
    updateDate: null,
    chairpersons: [],
    members: []
  },
  dar: {
    researcherProperties: [],
    researcherId: '',
    rus: '',
    status: '',
    hasAdminComment: false,
    adminComment: '',
    hasPurposeStatements: false,
    darCode: '',
    projectTitle: '',
    purposeStatements: [],
    hasDiseases: false,
    diseases: [],
    researchType: [],
    researchTypeManualReview: '',
    pi: '',
    havePI: false,
    profileName: '',
    institution: '',
    department: '',
    city: '',
    country: '',
    datasets: [],
    structuredRp: '',
    structuredLimitations: '',
    dataUse: {
      diseases: false,
      methods: false,
      controls: false,
      population: false,
      other: false,
      otherText: '',
      ontologies: [],
      forProfit: false,
      oneGender: false,
      gender: null,
      pediatric: false,
      illegalBehavior: false,
      addiction: false,
      sexualDiseases: false,
      stigmatizedDiseases: false,
      vulnerablePopulation: false,
      populationMigration: false,
      psychiatricTraits: false,
      notHealth: false
    }
  },
  error: { show: false, title: '', msg: [''] }
};
