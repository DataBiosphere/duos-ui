import {checkEnv, envGroups} from './EnvironmentUtils';

export const DAAUtils = {
  isEnabled: (): boolean => {
    return checkEnv(envGroups.NON_PROD);
  }
};