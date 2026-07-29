import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters";
  return errors;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function field(name) {
    return {
      value: form[name],
      onChange: (e) => {
        setForm({ ...form, [name]: e.target.value });
        if (errors[name]) setErrors({ ...errors, [name]: "" });
        setServerError("");
      },
      className: errors[name] ? "input-invalid" : "",
    };
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form);
      navigate("/space");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-panel" onSubmit={submit} noValidate>
        <p className="eyebrow">Knowledge Room</p>
        <h1>Welcome back</h1>

        {serverError && (
          <div className="form-error-banner"><AlertTriangle size={16} /> {serverError}</div>
        )}

        <div className="field-wrap">
          <input type="email" placeholder="Email" {...field("email")} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field-wrap">
          <input type="password" placeholder="Password" {...field("password")} />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button disabled={loading}>{loading ? "Logging in…" : "Login"}</button>
        <div className="auth-links">
          <Link to="/signup">Create account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </main>
  );
}
