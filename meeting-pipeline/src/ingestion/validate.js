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
    if (typeof body.attendees === "string") {
      attendees = body.attendees.split(",").map((a) => a.trim()).filter(Boolean);
    } else if (!Array.isArray(body.attendees)) {
      errors.push("attendees must be a string or an array of strings");
    } else {
      attendees = body.attendees
        .filter((a) => typeof a === "string" && a.trim().length > 0)
        .map((a) => a.trim());
    }
    if (attendees.length > LIMITS.MAX_ATTENDEES) {
      errors.push(`too many attendees (max ${LIMITS.MAX_ATTENDEES})`);
    }
  }

  let generateDoc = false;
  if (body.generate_doc === true || body.generate_doc === "true") {
    generateDoc = true;
  }

  let date = null;
  if (body.date != null) {
    if (typeof body.date !== "string" || isNaN(Date.parse(body.date))) {
      errors.push("date must be an ISO-8601 date string");
    } else {
      date = body.date;
    }
  }

  const itemsResult = parseItems(body.items, meetingTitle, transcript);
  if (!itemsResult.ok) {
    errors.push(...itemsResult.errors);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: { transcript, meetingTitle, attendees, date, items: itemsResult.items, generateDoc },
  };
}

function parseItems(raw, meetingTitle, transcript) {
  if (raw == null || raw === "") {
    return {
      ok: true,
      items: [
        {
          summary: meetingTitle,
          detail: transcript,
          owner: "",
          route: "human",
        },
      ],
    };
  }

  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return { ok: false, errors: ["items must be a JSON array"] };
    }
  }
  if (!Array.isArray(list)) {
    return { ok: false, errors: ["items must be an array"] };
  }
  if (list.length === 0) {
    return { ok: false, errors: ["items must not be empty"] };
  }
  if (list.length > LIMITS.MAX_ITEMS) {
    return { ok: false, errors: [`too many items (max ${LIMITS.MAX_ITEMS})`] };
  }

  const items = [];
  const errors = [];
  list.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      errors.push(`items[${index}] must be an object`);
      return;
    }
    const summary = typeof entry.summary === "string" ? entry.summary.trim() : "";
    if (!summary) {
      errors.push(`items[${index}].summary is required`);
    } else if (summary.length > LIMITS.MAX_TITLE_CHARS) {
      errors.push(`items[${index}].summary is too long`);
    }
    const detail = typeof entry.detail === "string" ? entry.detail.trim() : "";
    if (detail.length > LIMITS.MAX_ITEM_DETAIL) {
      errors.push(`items[${index}].detail is too long`);
    }
    const owner = typeof entry.owner === "string" ? entry.owner.trim() : "";
    const route = typeof entry.route === "string" ? entry.route.trim().toLowerCase() : "human";
    if (route !== "human" && route !== "agent") {
      errors.push(`items[${index}].route must be "human" or "agent"`);
    }
    items.push({ summary, detail, owner, route });
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, items };
}

module.exports = { validateIngestPayload };
