const api = require("@forge/api");
const { route } = api;
const { adfToText } = require("../utils");

async function loadIssue(issueKey) {
  const response = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=summary,description,status,labels`
  );

  if (response.status === 404) {
    return { ok: false, error: `No issue ${issueKey}, or this user cannot see it` };
  }
  if (!response.ok) {
    const errorBody = await response.text();
    return { ok: false, error: `Jira API ${response.status}: ${errorBody}` };
  }

  const issue = await response.json();
  const fields = issue.fields || {};
  return {
    ok: true,
    issueKey: issue.key,
    summary: fields.summary || "",
    status: fields.status?.name || "",
    labels: fields.labels || [],
    description: adfToText(fields.description),
  };
}

module.exports = { loadIssue };
