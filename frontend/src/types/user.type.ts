// User type to adapt API response
export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'REGULAR';
}