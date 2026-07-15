// Local mock outfit data (stand-in for the avatar_outfits table).
// Each user's saved voxel-avatar outfit colors.

export type Outfit = {
  skin: string
  hair: string
  top: string
  bottom: string
  shoes: string
}

export const avatarOutfits: Record<string, Outfit> = {
  // Alex — warm rose top
  AL: {
    skin: "#e7b48c",
    hair: "#3a2b28",
    top: "#d9808c",
    bottom: "#6f5b57",
    shoes: "#4a3b39",
  },
  // Annie — soft peach top
  AN: {
    skin: "#eec19b",
    hair: "#2d2320",
    top: "#e8a87c",
    bottom: "#8a6f6a",
    shoes: "#4a3b39",
  },
}

export function getOutfit(initials: string): Outfit {
  return avatarOutfits[initials] ?? avatarOutfits.AL
}
