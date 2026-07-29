import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <p className="eyebrow">Password reset</p>
        <h1>Reset flow placeholder</h1>
        <p className="muted">The app is ready for email reset integration later. For local testing, create a new account or use your existing password.</p>
        <Link className="button" to="/login">Back to login</Link>
      </section>
    </main>
  );
}
