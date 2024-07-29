/*
 * NOTE: See the Mixpanel guide in the terra-ui GitHub Wiki for more details:
 *   https://github.com/DataBiosphere/terra-ui/wiki/Mixpanel
 */
const eventList = {
  userRegister: 'user:register',
  userSignIn: 'user:signin',

  pageView: 'page:view',
  dataLibrary: 'page:view:dataLibrary',
  dataLibraryBrand: (brand) => {
    const cleanKey = brand.replaceAll('/', '');
    return `page:view:dataLibrary:${cleanKey}`;
  },
  dar: 'page:view:dar'
};

export default eventList;
