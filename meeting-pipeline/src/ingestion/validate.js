const { LIMITS } = require("../config");

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
  } else if (transcript.length < LIMITS.MIN_INPUT_CHARS) {
    errors.push(`transcript too short (min ${LIMITS.MIN_INPUT_CHARS} chars)`);
  } else if (transcript.length > LIMITS.MAX_INPUT_CHARS) {
    errors.push(`transcript too long (max ${LIMITS.MAX_INPUT_CHARS} chars)`);
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

  let generateDoc = false;
  if (body.generate_doc != null) {
    if (typeof body.generate_doc === "boolean") {
      generateDoc = body.generate_doc;
    } else if (body.generate_doc === "true" || body.generate_doc === "false") {
      generateDoc = body.generate_doc === "true";
    } else {
      errors.push("generate_doc must be a boolean");
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: { transcript, meetingTitle, attendees, date, generateDoc },
  };
}

module.exports = { validateIngestPayload };
