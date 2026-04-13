// apps/api/src/services/matchEngine.ts
// TF-IDF cosine similarity — blind match algorithm
// NEVER passes university name, graduation year, GPA, uniEmail, or institution signal

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function buildTfIdf(documents: string[][]): Record<string, number> {
  const N = documents.length;
  const idf: Record<string, number> = {};
  documents.forEach((doc) => {
    const seen = new Set(doc);
    seen.forEach((term) => {
      idf[term] = (idf[term] || 0) + 1;
    });
  });
  Object.keys(idf).forEach((term) => {
    idf[term] = Math.log(N / idf[term]);
  });
  return idf;
}

function vectorize(tokens: string[], idf: Record<string, number>): Record<string, number> {
  const tf: Record<string, number> = {};
  tokens.forEach((t) => {
    tf[t] = (tf[t] || 0) + 1;
  });
  const vec: Record<string, number> = {};
  tokens.forEach((t) => {
    vec[t] = (tf[t] / tokens.length) * (idf[t] || 0);
  });
  return vec;
}

function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0,
    magA = 0,
    magB = 0;
  keys.forEach((k) => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

export function scoreStudentForGig(studentProfile: any, gig: any): number {
  // Build student text from skills + projects + experience ONLY
  // DO NOT include university name, institution name, or any educational institution signal
  const studentText = [
    ...(studentProfile.skills || []),
    ...(Array.isArray(studentProfile.projects) ? studentProfile.projects : []).map(
      (p: any) => `${p.title || ''} ${p.description || ''} ${((p.tech as string[]) || []).join(' ')}`
    ),
    ...(Array.isArray(studentProfile.experience) ? studentProfile.experience : []).map(
      (e: any) => `${e.role || ''} ${((e.bullets as string[]) || []).join(' ')}`
    ),
    studentProfile.headline || '',
  ].join(' ');

  const gigText = [gig.title, gig.description, ...(gig.skills || [])].join(' ');

  const studentTokens = tokenize(studentText);
  const gigTokens = tokenize(gigText);

  if (!studentTokens.length || !gigTokens.length) return 0;

  const idf = buildTfIdf([studentTokens, gigTokens]);
  const studentVec = vectorize(studentTokens, idf);
  const gigVec = vectorize(gigTokens, idf);

  const similarity = cosineSimilarity(studentVec, gigVec);

  // Boost: exact skill tag matches (binary, weighted heavily)
  const gigSkills = new Set((gig.skills || []).map((s: string) => s.toLowerCase()));
  const studentSkills = new Set((studentProfile.skills || []).map((s: string) => s.toLowerCase()));
  const matchedSkills = [...gigSkills].filter((s) => studentSkills.has(s));
  const skillBoost = matchedSkills.length / Math.max(gigSkills.size, 1);

  // Final: 60% TF-IDF similarity + 40% skill tag overlap
  const final = similarity * 0.6 + skillBoost * 0.4;

  // Clamp to 0–1
  return Math.min(1, Math.max(0, final));
}
