import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    department: { type: String, required: true, trim: true },
    role: { type: String, enum: ["employee", "admin"], default: "employee" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 }
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    department: this.department,
    role: this.role,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const User = mongoose.model("User", userSchema);
