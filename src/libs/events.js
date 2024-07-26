/*
 * NOTE: See the Mixpanel guide in the terra-ui GitHub Wiki for more details:
 *   https://github.com/DataBiosphere/terra-ui/wiki/Mixpanel
 */
const eventList = {
  userRegister: 'user:register',
  userSignIn: 'user:signin',

  pageView: 'page:view',
  dataLibrary: 'page:view:data-library',
  dataLibraryBrand: (brand) => {
    const cleanKey = brand.replaceAll('/', '');
    return `page:view:data-library-${cleanKey}`;
  },
  dataLibraryDatasetSelected: 'page:view:data-library-dataset-selected',
  dataLibraryDatasetUnselected: 'page:view:data-library-dataset-unselected',
  dataLibraryStudySelected: 'page:view:data-library-study-selected',
  dataLibraryStudyUnselected: 'page:view:data-library-study-unselected'
};

export default eventList;
