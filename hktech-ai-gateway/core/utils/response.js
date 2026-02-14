export const nowIso = () => new Date().toISOString();

export const withMeta = (payload, meta = {}) => ({
  ...payload,
  last_updated: nowIso(),
  ...meta
});
