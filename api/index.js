export default async function handler(req, res) {
  const appModule = await import("../server/src/app.js");
  const app = appModule.default;
  return app(req, res);
}
