export function withCors(handler, { allowOrigin = '*', allowMethods = ['GET', 'OPTIONS'], allowHeaders = ['Content-Type'] } = {}) {
  return async function corsWrapped(req, res) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', allowMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowHeaders.join(', '));
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    return handler(req, res);
  };
}

