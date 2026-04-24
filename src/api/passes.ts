import apiClient from './client';
import type { DigitalPass } from '../types';
import { normalizeListResponse } from './normalize';

export interface GetPassesResponse {
  success: boolean;
  passes: DigitalPass[];
}

/**
 * Fetch digital passes for the authenticated student
 */
export const getPasses = async (): Promise<DigitalPass[]> => {
  const response = await apiClient.get('/digital-passes/');
  return normalizeListResponse<DigitalPass>(
    response.data,
    'passes',
    'digital_passes',
    'data'
  );
};

/**
 * Download a digital pass PDF
 */
export const downloadPass = async (passNumber: string): Promise<Blob> => {
  const response = await apiClient.get(`/pass/${passNumber}/download/`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * View a digital pass (returns blob for PDF/HTML rendering in iframe)
 */
export const viewPass = async (passNumber: string): Promise<Blob> => {
  const response = await apiClient.get(`/pass/${passNumber}/view/`, {
    responseType: 'blob',
  });
  return response.data;
};
