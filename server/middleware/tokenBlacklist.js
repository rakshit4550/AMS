import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RevokedToken from '../model/RevokedToken.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const revokeAccessToken = async (token) => {
  if (!token) return;

  const decoded = jwt.decode(token);
  const expiresAtMs = Number(decoded?.exp) * 1000;

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return;
  }

  try {
    await RevokedToken.create({
      tokenHash: hashToken(token),
      expiresAt: new Date(expiresAtMs),
    });
  } catch (error) {
    if (error.code === 11000) return;
    throw error;
  }
};

export const isAccessTokenRevoked = async (token) => {
  if (!token) return false;
  const existing = await RevokedToken.exists({ tokenHash: hashToken(token) });
  return Boolean(existing);
};
