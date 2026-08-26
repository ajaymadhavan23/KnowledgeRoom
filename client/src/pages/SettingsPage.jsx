import { Camera, Check, Loader2, Save, User2 } from "lucide-react";
import { useRef, useState } from "react";
import Avatar from "../components/shared/Avatar.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { updateMe } from "../services/authService.js";

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Marketing",
  "Sales", "HR", "Finance", "Operations", "Legal", "Other",
];

function validate({ name, department }) {
  const errors = {};
  if (!name?.trim()) errors.name = "Name cannot be empty";
  if (!department?.trim()) errors.department = "Department cannot be empty";
  return errors;
}

/** Resize + compress a File to a small JPEG data-URL (max 256×256, ~40 KB). */
function compressImage(file, maxSize = 256, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(user || { name: "", department: "", avatarUrl: "", bio: "" });
  const [preview, setPreview] = useState(form.avatarUrl || null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef(null);

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

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please pick an image file.");
      return;
    }
    setCompressing(true);
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      setForm((f) => ({ ...f, avatarUrl: dataUrl }));
      setMessage("");
    } catch {
      setMessage("Could not process the image.");
    } finally {
      setCompressing(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const updated = await updateMe(form);
      setUser(updated);
      setMessage("✓ Profile saved");
    } catch {
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  const avatarUser = { ...form, avatarUrl: preview };

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings &amp; Profile" />

      <div className="settings-layout">
        {/* ── Left: Avatar card ── */}
        <div className="settings-avatar-card panel">
          <div className="avatar-upload-area" onClick={() => fileRef.current?.click()}>
            <Avatar user={avatarUser} size="lg" />
            <div className="avatar-upload-overlay">
              {compressing
                ? <Loader2 size={20} className="spin" />
                : <Camera size={20} />}
              <span>{compressing ? "Processing…" : "Change photo"}</span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoChange}
          />
          <div className="avatar-card-info">
            <strong>{form.name || "Your Name"}</strong>
            <span className="sidebar-user-role">{form.department || "Department"}</span>
          </div>
          <p className="avatar-card-hint">
            Click the avatar to upload a photo.<br />
            Supports JPG, PNG, WebP.
          </p>
        </div>

        {/* ── Right: Form ── */}
        <form className="settings-form panel" onSubmit={submit} noValidate>
          <div className="settings-section-label">
            <User2 size={15} /> Personal Info
          </div>

          <div className="settings-row">
            <div className="field-wrap">
              <label>Full Name</label>
              <input placeholder="Your full name" {...field("name")} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="field-wrap">
              <label>Department</label>
              <select
                value={form.department || ""}
                onChange={(e) => {
                  setForm({ ...form, department: e.target.value });
                  setMessage("");
                }}
                className={errors.department ? "input-invalid" : ""}
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.department && <span className="field-error">{errors.department}</span>}
            </div>
          </div>

          <div className="field-wrap">
            <label>Bio</label>
            <textarea
              rows="4"
              placeholder="Tell your team a little about yourself — your role, expertise, what you're working on…"
              {...field("bio")}
            />
          </div>

          <div className="settings-save-row">
            {message && (
              <p className={message.startsWith("✓") ? "success" : "error"}>
                {message.startsWith("✓") && <Check size={14} />} {message}
              </p>
            )}
            <button type="submit" className="settings-save-btn" disabled={saving || compressing}>
              {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : <><Save size={15} /> Save profile</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
