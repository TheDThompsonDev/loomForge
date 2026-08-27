const crypto = require("crypto");

// Signature verification, mirroring the Twilio HMAC pattern from the
// WhatsApp app but for our own front door: the sender computes
// HMAC-SHA256(sharedSecret, rawBody) and puts the hex digest in the
// x-pipeline-signature header. demo/send-transcript scripts do this.
function verifySignature(sharedSecret, rawBody, signature) {
  if (!sharedSecret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", sharedSecret)
    .update(rawBody || "", "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function getSignatureHeader(request) {
  const header = request.headers?.["x-pipeline-signature"];
  return Array.isArray(header) ? header[0] : header;
}

module.exports = { verifySignature, getSignatureHeader };
