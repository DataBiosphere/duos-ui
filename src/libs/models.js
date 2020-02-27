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
    translatedUseRestriction: ''
  },
  error: { show: false, title: '', msg: [''] }
};
