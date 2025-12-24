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

  /**
   * Update the profile of the currently authenticated user
   */
  static async updateProfile(
    userId: string,
    updates: {
      username?: string;
      displayName?: string;
      avatarUrl?: string;
      aliasMode?: boolean;
      quokkaCitizenshipLevel?: number;
      quokkaStamps?: string[];
      quokkaBadges?: string[];
    }
  ): Promise<Profile> {
    // Check if profile exists
    const existing = await prisma.profiles.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new Error("Profile not found");
    }

    // Build update data (only include fields that are provided)
    const updateData: any = {};
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.aliasMode !== undefined) updateData.alias_mode = updates.aliasMode;
    if (updates.quokkaCitizenshipLevel !== undefined) updateData.quokka_citizenship_level = updates.quokkaCitizenshipLevel;
    if (updates.quokkaStamps !== undefined) updateData.quokka_stamps = updates.quokkaStamps;
    if (updates.quokkaBadges !== undefined) updateData.quokka_badges = updates.quokkaBadges;

    const updated = await prisma.profiles.update({
      where: { id: userId },
      data: updateData,
    });

    return toProfileDomain(updated);
  }
}
