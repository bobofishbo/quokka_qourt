// domain/profileService.ts

import { prisma } from "../../db/prisma";
import { toProfileDomain } from "./ProfileMapper";
import { Profile } from "./Profile";

export class ProfileService {
  /**
   * Create a profile for a newly authenticated user.
   * This should only ever happen once.
   */
  static async createProfile(input: {
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    aliasMode?: boolean;
  }): Promise<Profile> {
    // Rule 1: one profile per user
    const existing = await prisma.profiles.findUnique({
      where: { id: input.userId },
    });

    if (existing) {
      throw new Error("Profile already exists");
    }

    // Rule 2: create with defaults
    const created = await prisma.profiles.create({
      data: {
        id: input.userId, // ← critical: same as auth.users.id
        username: input.username,
        display_name: input.displayName ?? null,
        avatar_url: input.avatarUrl ?? null,
        alias_mode: input.aliasMode ?? false,

        quokka_citizenship_level: 1,
        quokka_stamps: [],
        quokka_badges: [],
      },
    });

    return toProfileDomain(created);
  }

  /**
   * Fetch the profile of the currently authenticated user
   */
  static async getProfileByUserId(userId: string): Promise<Profile | null> {
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
    });

    if (!profile) return null;

    return toProfileDomain(profile);
  }
}
