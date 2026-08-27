const { LIMITS } = require("../config");

// Step 3: deterministic payload validation. No AI anywhere near this.
// Returns { ok: true, payload } or { ok: false, errors: [...] }.
function validateIngestPayload(raw) {
  const errors = [];

  let body;
  try {
    body = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ok: false, errors: ["Body is not valid JSON"] };
  }
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Body must be a JSON object"] };
  }

  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    errors.push("transcript is required");
  } else if (transcript.length < LIMITS.MIN_TRANSCRIPT_CHARS) {
    errors.push(`transcript too short (min ${LIMITS.MIN_TRANSCRIPT_CHARS} chars)`);
  } else if (transcript.length > LIMITS.MAX_TRANSCRIPT_CHARS) {
    errors.push(`transcript too long (max ${LIMITS.MAX_TRANSCRIPT_CHARS} chars)`);
  }

  const meetingTitle =
    typeof body.meeting_title === "string" ? body.meeting_title.trim() : "";
  if (!meetingTitle) {
    errors.push("meeting_title is required");
  } else if (meetingTitle.length > LIMITS.MAX_TITLE_CHARS) {
    errors.push(`meeting_title too long (max ${LIMITS.MAX_TITLE_CHARS} chars)`);
  }

  let attendees = [];
  if (body.attendees != null) {
    if (!Array.isArray(body.attendees)) {
      errors.push("attendees must be an array of strings");
    } else if (body.attendees.length > LIMITS.MAX_ATTENDEES) {
      errors.push(`too many attendees (max ${LIMITS.MAX_ATTENDEES})`);
    } else {
      attendees = body.attendees
        .filter((a) => typeof a === "string" && a.trim().length > 0)
        .map((a) => a.trim());
    }
  }

  let date = null;
  if (body.date != null) {
    if (typeof body.date !== "string" || isNaN(Date.parse(body.date))) {
      errors.push("date must be an ISO-8601 date string");
    } else {
      date = body.date;
    }
  }

  // Path A (Loom): optional link back to the source recording. Loom has no
  // public transcript API (see docs/LOOM.md), so the transcript itself
  // always arrives in the payload, the URL is for traceability.
  let loomUrl = null;
  if (body.loom_url != null) {
    if (
      typeof body.loom_url !== "string" ||
      !/^https:\/\/(www\.)?loom\.com\/share\/[\w-]+/.test(body.loom_url.trim())
    ) {
      errors.push("loom_url must be a https://www.loom.com/share/... URL");
    } else {
      loomUrl = body.loom_url.trim();
    }
  }

  let generateDoc = false;
  if (body.generate_doc != null) {
    if (typeof body.generate_doc !== "boolean") {
      errors.push("generate_doc must be a boolean");
    } else {
      generateDoc = body.generate_doc;
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: { transcript, meetingTitle, attendees, date, loomUrl, generateDoc },
  };
}

module.exports = { validateIngestPayload };
