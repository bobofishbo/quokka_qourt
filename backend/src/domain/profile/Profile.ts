// domain/profile.ts

export interface Profile {
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
  