const { kvs: storage, WhereConditions } = require("@forge/kvs");
const { STORE } = require("./config");

async function saveJob(jobId, state) {
  await storage.set(`${STORE.JOB}${jobId}`, { ...state, updatedAt: new Date().toISOString() });
}

async function getJob(jobId) {
  return storage.get(`${STORE.JOB}${jobId}`);
}

async function saveResearch(issueKey, record) {
  await storage.set(`${STORE.RESEARCH}${issueKey}`, {
    ...record,
    updatedAt: new Date().toISOString(),
  });
}

async function getResearch(issueKey) {
  return storage.get(`${STORE.RESEARCH}${issueKey}`);
}

async function saveHandoff(issueKey, record) {
  await storage.set(`${STORE.HANDOFF}${issueKey}`, {
    ...record,
    updatedAt: new Date().toISOString(),
  });
}

async function getHandoff(issueKey) {
  return storage.get(`${STORE.HANDOFF}${issueKey}`);
}

async function listJobs(limit = 10) {
  const page = await storage
    .query()
    .where("key", WhereConditions.beginsWith(STORE.JOB))
    .limit(limit)
    .getMany();
  return (page.results || [])
    .map((row) => ({
      jobId: String(row.key || "").replace(STORE.JOB, ""),
      ...(row.value || {}),
    }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

module.exports = {
  saveJob,
  getJob,
  saveResearch,
  getResearch,
  saveHandoff,
  getHandoff,
  listJobs,
};
