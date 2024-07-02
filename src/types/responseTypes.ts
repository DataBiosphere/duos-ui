import { LibraryCard, UserProperty, UserRole, UserStatusInfo } from './model';

export interface DuosUserResponse {
  createDate: Date;
  displayName: string;
  email: string;
  emailPreference: boolean;
  libraryCards: LibraryCard[];
  researcherProperties: UserProperty[];
  roles: UserRole[];
  userId: number;
  userStatusInfo: UserStatusInfo;
}

export type CreateDuosUserResponse = DuosUserResponse | false | undefined;

export type UpdateDuosUserResponse = CreateDuosUserResponse;
