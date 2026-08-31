const { kvs: storage } = require("@forge/kvs");
const { STORE } = require("./config");

async function saveJob(jobId, state) {
  await storage.set(`${STORE.JOB}${jobId}`, { ...state, updatedAt: new Date().toISOString() });
}

async function getJob(jobId) {
  return storage.get(`${STORE.JOB}${jobId}`);
}

module.exports = { saveJob, getJob };
