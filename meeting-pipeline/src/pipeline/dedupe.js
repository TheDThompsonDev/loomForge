// Step 10: dedupe check. Deterministic code, not AI. Searches existing open
// tickets for each action item and flags likely duplicates. It never
// auto-discards (spec: "flag, don't auto-discard"). A flagged item still
// becomes a ticket; it just carries the possible-duplicate label and the
// matched keys in its description, so the human reviewer decides.
const api = require("@forge/api");
const { route } = api;

async function flagDuplicates(actionItems) {
  return Promise.all(
    actionItems.map(async (item) => {
      const matches = await findSimilarOpenTickets(item.summary);
      return {
        ...item,
        possible_duplicates: matches,
      };
    })
  );
}

async function findSimilarOpenTickets(summary) {
  try {
    const terms = significantTerms(summary);
    if (terms.length === 0) return [];

    const jql = `statusCategory != Done AND summary ~ "${terms.join(" ")}" ORDER BY updated DESC`;
    const response = await api.asApp().requestJira(
      route`/rest/api/3/search/jql?jql=${jql}&maxResults=5&fields=summary,status`
    );
    if (!response.ok) {
      console.warn(`[Dedupe] Jira search failed: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.issues || [])
      .map((issue) => ({
        key: issue.key,
        summary: issue.fields?.summary || "",
        status: issue.fields?.status?.name || "",
        similarity: jaccardSimilarity(summary, issue.fields?.summary || ""),
      }))
      .filter((m) => m.similarity >= 0.4)
      .sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.warn("[Dedupe] search error:", error.message);
    return [];
  }
}

// Word-level Jaccard similarity, simple, explainable, deterministic.
function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

function significantTerms(summary) {
  return tokenize(summary).slice(0, 6);
}

module.exports = { flagDuplicates, jaccardSimilarity };
