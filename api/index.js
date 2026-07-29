export default async function handler(req, res) {
  const { default: app } = await import("../server/src/app.js");
  return app(req, res);
}
