import React from 'react';
import _ from 'lodash';
import '../DatasetCatalog';
import SampleLogoIcon from '../../images/sample_dac_logo.png';
import BroadLogoIcon from '../../images/broad_logo.png';
import NotFound from '../NotFound';
import DatasetCatalog from '../DatasetCatalog';
import './CustomDatasetCatalog.css';


/**
 * Variants can be added and must include the following:
 * path: the last element of the path that will identify this catalog variant
 * icon: an icon for the catalog variant.  It should have as close to a 4x1 ratio as possible
 * dacName: the name of the DAC that this catalog is for
 * dacFilter: filter method to get the datasets to show on the catalog by default. Return true to include
 * the referenced dataset.  The callback takes:
 *     dataset: the datataset to evaluate.  The content of the dataset may vary, as a result to see what
 *              fields are available, open the developer console and go to the sample page.  The datasets will
 *              echoed to the console in dev or local mode
 * colorKey: the key of the color scheme for the catalog.  See the CustomDatasetCatalog.css file for
 *   instructions on how to use the colorKey
 */
const variants = (env) => [
  {
    path: 'sample',
    icon: SampleLogoIcon,
    dacName: 'Sample',
    dacFilter: (dataset) => {
      // eslint-disable-next-line no-console
      (_.indexOf(['local', 'dev'], env) > -1) && console.log(dataset);
      return dataset['Data Access Committee'] === 'Demo Dac New';
    },
    colorKey: 'sample'
  },
  {
    path: 'broad',
    icon: BroadLogoIcon,
    dacName: 'Broad',
    dacFilter: (dataset) => dataset.dacId === 4,
    colorKey: 'broad'
  },
];

export const CustomDatasetCatalog = (props) => {
  const { history, match: { params: { variant } }, env } = props;

  const resolvedVariants = variants(env);
  const findVariant = (variant) => _.find(resolvedVariants, v => v.path === variant);

  const variantDef = findVariant(variant);
  if (_.isEmpty(variantDef)) {
    return <NotFound />;
  }

  return (
    <DatasetCatalog
      customDacDatasetPage={variantDef}
      history={history}
    />
  );
};

export default CustomDatasetCatalog;