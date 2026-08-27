// AI slot 1 of 2. One job: transcript in, schema JSON out.
// The prompt is strict; the schema gate (schemaGate.js) is stricter.
const { callModel } = require("../llm");
const { LIMITS } = require("../config");

const EXTRACTION_SYSTEM_PROMPT = `You extract decisions and action items from meeting transcripts for an engineering team.

Respond only with a valid JSON object, no markdown, no code fences, matching exactly this shape:

{
  "meeting_id": "<the meeting id you were given>",
  "decisions": [
    { "text": "what was decided", "made_by": "person or null", "dissent": "objection raised, or null" }
  ],
  "action_items": [
    {
      "summary": "imperative, specific, max ${LIMITS.MAX_SUMMARY_LENGTH} characters",
      "description": "enough context that an engineer who missed the meeting can act on it",
      "evidence_quote": "an exact, verbatim quote from the transcript that proves this action item was actually discussed",
      "suggested_owner": "person named in the transcript as responsible, or null",
      "priority": "highest|high|medium|low or null",
      "acceptance_criteria": ["specific, testable condition"],
      "confidence": 0.0
    }
  ]
}

Hard rules:
- evidence_quote MUST be copied character-for-character from the transcript. It will be checked by code. An action item whose quote is not found verbatim in the transcript will be discarded.
- Only include action items that were actually discussed. Do not invent owners, deadlines, or priorities that nobody said.
- If ownership was left ambiguous, set suggested_owner to null. Null is a correct answer; a guess is not.
- If no urgency was expressed, set priority to null. Do not default to medium.
- confidence is your honest estimate (0 to 1) that this item is a real commitment, not a passing remark.
- decisions capture what was concluded, including who decided and any recorded dissent.`;

async function extract({ meetingId, meetingTitle, attendees, transcript, repairError }) {
  let user = `Meeting id: ${meetingId}
Meeting title: ${meetingTitle}
Attendees: ${attendees && attendees.length ? attendees.join(", ") : "(not provided)"}

Transcript:
"""
${transcript}
"""`;

  if (repairError) {
    // Repair loop: same request plus the validator's exact complaint.
    user += `

Your previous response failed schema validation with these errors:
${repairError}

Return a corrected JSON object that fixes every error listed. Same rules apply.`;
  }

  return callModel({ system: EXTRACTION_SYSTEM_PROMPT, user, maxTokens: 8192 });
}

module.exports = { extract, EXTRACTION_SYSTEM_PROMPT };
