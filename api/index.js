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
