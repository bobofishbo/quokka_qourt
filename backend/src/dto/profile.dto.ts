// DTOs (Data Transfer Objects) define the shape of data at the API boundary
// They separate API contracts from domain models and provide type safety

/**
 * Request DTO for creating a profile during onboarding
 */
export interface CreateProfileRequestDto {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  aliasMode?: boolean;
}

/**
 * Request DTO for updating a profile
 */
export interface UpdateProfileRequestDto {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  aliasMode?: boolean;
  quokkaCitizenshipLevel?: number;
  quokkaStamps?: string[];
  quokkaBadges?: string[];
}

/**
 * Response DTO for profile data
 * This matches the domain Profile model but can be customized for API responses
 */
export interface ProfileResponseDto {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  aliasMode: boolean | null;
  quokkaCitizenshipLevel: number | null;
  quokkaStamps: string[];
  quokkaBadges: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Error response DTO for consistent error formatting
 */
export interface ErrorResponseDto {
  error: string;
  message: string;
}

