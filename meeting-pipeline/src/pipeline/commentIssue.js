const api = require("@forge/api");
const { route } = api;

async function commentIssue({ issueKey, lines, asUser }) {
  const client = asUser ? api.asUser() : api.asApp();
  const content = lines
    .filter((line) => line && (line.text || line.link))
    .map((line) => ({
      type: "paragraph",
      content: line.link
        ? [{ type: "text", text: line.link, marks: [{ type: "link", attrs: { href: line.link } }] }]
        : [
            ...(line.prefix
              ? [{ type: "text", text: line.prefix, marks: [{ type: "em" }] }]
              : []),
            {
              type: "text",
              text: line.text,
              ...(line.strong ? { marks: [{ type: "strong" }] } : {}),
            },
          ].filter((node) => node.text),
    }));

  const response = await client.requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      body: { type: "doc", version: 1, content },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.warn(`[Jira] comment on ${issueKey} failed: ${response.status} ${errorBody}`);
    return false;
  }
  return true;
}

module.exports = { commentIssue };
