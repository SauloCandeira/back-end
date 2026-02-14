import https from "https";
import crypto from "crypto";
import { logSystemEvent } from "../services/logging.service.js";

const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let cachedCerts = null;
let cachedAt = 0;

const fetchCerts = () => new Promise((resolve, reject) => {
  https.get(CERTS_URL, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
  }).on("error", reject);
});

const getCerts = async () => {
  const now = Date.now();
  if (cachedCerts && now - cachedAt < 60 * 60 * 1000) {
    return cachedCerts;
  }
  const certs = await fetchCerts();
  cachedCerts = certs;
  cachedAt = now;
  return certs;
};

const base64UrlDecode = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
};

const parseJwt = (token) => {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  try {
    return {
      header: JSON.parse(base64UrlDecode(header)),
      payload: JSON.parse(base64UrlDecode(payload)),
      signature,
      signedData: `${header}.${payload}`
    };
  } catch (error) {
    return null;
  }
};

const verifyFirebaseJwt = async (token) => {
  const parsed = parseJwt(token);
  if (!parsed) return null;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "";
  if (!projectId) return null;

  if (parsed.payload.aud !== projectId) return null;
  const issuer = `https://securetoken.google.com/${projectId}`;
  if (parsed.payload.iss !== issuer) return null;
  if (!parsed.payload.sub) return null;
  if (parsed.payload.exp && Date.now() / 1000 > parsed.payload.exp) return null;

  const certs = await getCerts();
  const cert = certs[parsed.header.kid];
  if (!cert) return null;

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(parsed.signedData);
  verifier.end();
  const signature = Buffer.from(parsed.signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const valid = verifier.verify(cert, signature);
  if (!valid) return null;
  return parsed.payload;
};

export const authMiddleware = async (req, res, next) => {
  const internalKey = process.env.INTERNAL_API_KEY || process.env.API_KEY || process.env.INTERNAL_KEY || "";
  const rawApiKey = req.headers["x-api-key"] || req.headers["x-internal-key"];
  const apiKey = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey;
  const normalizedKey = typeof apiKey === "string" ? apiKey.trim() : "";
  const authHeader = req.headers.authorization || "";

  if (internalKey && normalizedKey && normalizedKey === internalKey) {
    req.authSource = "internal";
    res.locals.authSource = "internal";
    res.setHeader("X-Request-Source", "internal");
    return next();
  }

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    try {
      const payload = await verifyFirebaseJwt(token);
      if (payload) {
        req.authSource = "admin";
        req.authUser = payload.sub || null;
        res.locals.authSource = "admin";
        res.setHeader("X-Request-Source", "admin");
        return next();
      }
    } catch (error) {
      logSystemEvent({
        action: "auth_error",
        status: "denied",
        metadata: { error: error.message }
      });
    }
  }

  logSystemEvent({
    action: "auth_reject",
    status: "denied",
    metadata: { path: req.path, ip: req.ip }
  });
  return res.status(401).json({
    error: "Unauthorized",
    source: "external",
    timestamp: new Date().toISOString()
  });
};
