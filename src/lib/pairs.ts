export type PairRow = {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
};

export function buildUnlinkedPairUpdate(pair: PairRow, userId: string) {
  if (pair.user_a_id === userId) {
    if (!pair.user_b_id) {
      return { action: "delete" as const };
    }

    return {
      action: "update" as const,
      values: {
        user_a_id: pair.user_b_id,
        user_b_id: null,
        status: "unlinked" as const,
      },
    };
  }

  return {
    action: "update" as const,
    values: {
      user_a_id: pair.user_a_id,
      user_b_id: null,
      status: "unlinked" as const,
    },
  };
}
