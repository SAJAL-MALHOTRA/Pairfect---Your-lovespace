/**
 * Calculates the Levenshtein distance between two strings.
 * Used for typo tolerance in game answers.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Normalizes input text by removing noise words, articles, prefixes,
 * punctuation, and collapsing multiple spaces.
 */
export function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    // Remove common prefixes/articles
    .replace(/^(the|a|an|mount|mt\.?)\s+/g, "")
    // Remove common punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Grades user answer against the correct answer using exact match,
 * substring inclusion, and Levenshtein similarity (with 80% threshold).
 */
export function checkCorrectAnswer(userAns: string, correctAns: string): boolean {
  if (!userAns || !correctAns) return false;

  const cleanUser = normalizeText(userAns);
  const cleanCorrect = normalizeText(correctAns);

  if (!cleanUser || !cleanCorrect) return false;

  // 1. Direct or Substring match
  if (cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
    return true;
  }

  // 2. Typo tolerance: Levenshtein distance check
  const distance = getLevenshteinDistance(cleanUser, cleanCorrect);
  const maxLength = Math.max(cleanUser.length, cleanCorrect.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= 0.8; // 80% similarity threshold
}
