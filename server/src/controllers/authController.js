import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ensureSavedFolder } from "../utils/folders.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";

function authPayload(user) {
  return {
    user: user.toSafeJSON(),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user)
  };
}

export async function signup(req, res, next) {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "Name, email, password, and department are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const count = await User.countDocuments();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      department,
      role: count === 0 ? "admin" : "employee"
    });

    await ensureSavedFolder(user._id);
    res.status(201).json(authPayload(user));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await ensureSavedFolder(user._id);
    res.json(authPayload(user));
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json(authPayload(user));
  } catch (error) {
    next(error);
  }
}

export async function logout(_req, res) {
  res.json({ message: "Logged out" });
}

export async function me(req, res) {
  res.json(req.user.toSafeJSON());
}
