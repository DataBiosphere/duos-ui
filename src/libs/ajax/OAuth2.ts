import axios from 'axios';
import {Config} from '../config';

export interface OAuthConfig {
    clientId: string;
    authorityEndpoint: string;
}

export const OAuth2 = {
  getConfig: async (): Promise<OAuthConfig> => getConfig(),
};

const getConfig = async (): Promise<OAuthConfig> => {
  const configUrl = `${await Config.getApiUrl()}/oauth2/configuration`;
  return (await axios.get(configUrl)).data;
};
