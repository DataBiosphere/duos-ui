/**
 * Asset registry for the Data Library.
 *
 * To add a new asset type:
 *   1. Add its value to the `AssetType` enum in `src/types/library.ts`
 *   2. Create `<newAsset>Asset.ts` in this folder implementing `AssetDefinition`
 *   3. Import it below and add it to `assetRegistry`
 *
 * No changes are needed in `useLibraryData`, `LibraryDataGrid`, or
 * `DataLibrary` — they all delegate to the registry.
 */
import { AssetType } from 'src/types/library'
import { AssetDefinition } from 'src/components/data_library/assets/definition'
import { studyAsset } from 'src/components/data_library/assets/studyAsset'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { modelAsset } from 'src/components/data_library/assets/modelAsset'
import { clinicalTrialAsset } from 'src/components/data_library/assets/clinicalTrialAsset'
import { biospecimenAsset } from 'src/components/data_library/assets/biospecimenAsset'
import { publicationAsset } from 'src/components/data_library/assets/publicationAsset'
import { presentationAsset } from 'src/components/data_library/assets/presentationAsset'

export type {
  AssetDefinition,
  LibraryRow,
  LibraryPage,
  ColumnsProps,
} from 'src/components/data_library/assets/definition'

export const assetRegistry: Record<AssetType, AssetDefinition> = {
  [AssetType.STUDIES]: studyAsset,
  [AssetType.DATASETS]: datasetAsset,
  [AssetType.MODELS]: modelAsset,
  [AssetType.CLINICAL_TRIALS]: clinicalTrialAsset,
  [AssetType.BIOSPECIMENS]: biospecimenAsset,
  [AssetType.PUBLICATIONS]: publicationAsset,
  [AssetType.PRESENTATIONS]: presentationAsset,
}
