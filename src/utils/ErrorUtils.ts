import {AxiosError} from 'axios';
import {ConsentError} from 'src/types/responseTypes';

export function extractError(error: unknown): string {
  const axiosError = error as AxiosError;
  const consentError = axiosError?.response?.data as ConsentError;
  return consentError?.message ?? 'Unknown error';
}
