import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, accessSecret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m"
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}
