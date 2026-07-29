import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";

const departments = ["Engineering", "Product", "Design", "Sales", "Marketing", "HR", "Finance", "Operations"];

function validate({ name, email, password }) {
  const errors = {};
  if (!name.trim()) errors.name = "Full name is required";
  else if (name.trim().length < 2) errors.name = "Name must be at least 2 characters";

  if (!email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address";

  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    errors.password = "Password must include letters and numbers";

  return errors;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", department: departments[0] });
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
      await signup(form);
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
        <h1>Create account</h1>

        {serverError && (
          <div className="form-error-banner">⚠️ {serverError}</div>
        )}

        <div className="field-wrap">
          <input placeholder="Full name" {...field("name")} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field-wrap">
          <input type="email" placeholder="Email" {...field("email")} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field-wrap">
          <input type="password" placeholder="Password (min. 6 chars, letters + numbers)" {...field("password")} />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          {departments.map((dept) => <option key={dept}>{dept}</option>)}
        </select>

        <button disabled={loading}>{loading ? "Creating account…" : "Sign up"}</button>
        <Link to="/login">Already have an account?</Link>
      </form>
    </main>
  );
}
