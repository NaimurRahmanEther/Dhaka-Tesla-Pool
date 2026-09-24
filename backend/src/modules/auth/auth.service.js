const authRepository = require("./auth.repository");

const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("./auth.utils");

const AppError = require("../../utils/AppError");

const register = async (data) => {
  const existingUser = await authRepository.findUserByEmail(data.email);

  if (existingUser) {
    throw new AppError("Email already exists", 400);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await authRepository.createUser({
    name: data.name,

    email: data.email,

    password: hashedPassword,

    role: data.role,
  });

  return user;
};

const login = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await comparePassword(
    password,

    user.password_hash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  await authRepository.saveRefreshToken({
    userId: user.id,

    token: refreshToken,

    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,

    refreshToken,
  };
};

const refreshAccessToken = async (refreshToken) => {
  const isBlacklisted = await authRepository.isTokenBlacklisted(refreshToken);

  if (isBlacklisted) {
    throw new AppError("Refresh token revoked", 401);
  }

  const storedToken = await authRepository.findRefreshToken(refreshToken);

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError("Refresh token expired", 401);
  }

  const user = {
    id: decoded.id,

    role: decoded.role,
  };

  const newAccessToken = generateAccessToken(user);

  return newAccessToken;
};

const logout = async (
  accessToken,

  refreshToken,
) => {
  if (accessToken) {
    await authRepository.addBlacklistToken({
      token: accessToken,

      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
  }

  if (refreshToken) {
    await authRepository.addBlacklistToken({
      token: refreshToken,

      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await authRepository.deleteRefreshToken(refreshToken);
  }
};

module.exports = {
  register,

  login,

  refreshAccessToken,

  logout,
};
