// domain/profileMapper.ts

import { Profile } from "./Profile";
import { profilesModel as PrismaProfile } from "../../generated/prisma/models/profiles";

export function toProfileDomain(dbProfile: PrismaProfile): Profile {
  return {
    id: dbProfile.id,

    username: dbProfile.username,
    displayName: dbProfile.display_name,
    avatarUrl: dbProfile.avatar_url,
    aliasMode: dbProfile.alias_mode,

    quokkaCitizenshipLevel: dbProfile.quokka_citizenship_level,
    quokkaStamps: dbProfile.quokka_stamps ?? [],
    quokkaBadges: dbProfile.quokka_badges ?? [],

    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}
