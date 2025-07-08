import { LibraryCard, UserProperty, UserRole, UserStatusInfo } from './model';

export interface DuosUserResponse {
  createDate: Date;
  displayName: string;
  email: string;
  emailPreference: boolean;
  libraryCard?: LibraryCard;
  properties?: UserProperty[];
  roles: UserRole[];
  userId: number;
  userStatusInfo: UserStatusInfo;
}

export type CreateDuosUserResponse = DuosUserResponse | false | undefined;

export type UpdateDuosUserResponse = CreateDuosUserResponse;

export interface ConsentError {
  readonly message?: string;
  readonly code?: number;
}
