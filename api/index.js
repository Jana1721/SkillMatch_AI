if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

export default async function handler(req, res) {
  try {
    const { default: app } = await import('./app.js');
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Invocation Error]', err);
    return res.status(500).json({
      error: 'SERVERLESS_IMPORT_ERROR',
      message: err.message,
      stack: err.stack
    });
  }
}
