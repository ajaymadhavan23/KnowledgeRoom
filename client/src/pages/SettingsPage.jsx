import { useState } from "react";
import PageHeader from "../components/shared/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { updateMe } from "../services/authService.js";

function validate({ name, department }) {
  const errors = {};
  if (!name?.trim()) errors.name = "Name cannot be empty";
  if (!department?.trim()) errors.department = "Department cannot be empty";
  return errors;
}

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(user || { name: "", department: "", avatarUrl: "", bio: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function field(name) {
    return {
      value: form[name] || "",
      onChange: (e) => {
        setForm({ ...form, [name]: e.target.value });
        if (errors[name]) setErrors({ ...errors, [name]: "" });
        setMessage("");
      },
      className: errors[name] ? "input-invalid" : "",
    };
  }

  async function submit(event) {
    event.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMe(form);
      setUser(updated);
      setMessage("Profile updated successfully ✓");
    } catch {
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings & Profile" />
      <form className="panel settings-form" onSubmit={submit} noValidate>
        <div className="field-wrap">
          <label>Full Name</label>
          <input placeholder="Name" {...field("name")} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field-wrap">
          <label>Department</label>
          <input placeholder="Department" {...field("department")} />
          {errors.department && <span className="field-error">{errors.department}</span>}
        </div>

        <div className="field-wrap">
          <label>Avatar URL</label>
          <input placeholder="Avatar URL (optional)" {...field("avatarUrl")} />
        </div>

        <div className="field-wrap">
          <label>Bio</label>
          <textarea rows="4" placeholder="Short bio..." {...field("bio")} />
        </div>

        <button disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
        {message && <p className={message.includes("✓") ? "success" : "error"}>{message}</p>}
      </form>
    </>
  );
}
