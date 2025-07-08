import {AxiosError} from 'axios';
import {ConsentError} from 'src/types/responseTypes';

export function extractError(error: unknown): string {
  const consentError = extractConsentError(error);
  return consentError?.message ?? 'Unknown error';
}

export function extractConsentError(error: unknown): ConsentError | undefined {
  const axiosError = error as AxiosError;
  return axiosError?.response?.data as ConsentError;
}
