/**
 * Generic API response wrapper
 * All API responses follow this structure with status and data fields
 */
export interface ApiResponse<T> {
  status: string;
  data: T;
}