const authService = require("./auth.service");
const successResponse = require("../../utils/response");
const asyncHandler = require("../../middleware/asyncHandler");
const AppError = require("../../utils/AppError");
const env = require("../../config/env");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return successResponse(res, 201, "User registered successfully", user);
});

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.login(
    req.body.email,
    req.body.password,
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    // Must be true behind HTTPS or the browser will never send the cookie back.
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return successResponse(res, 200, "Login successful", { accessToken });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw new AppError("Refresh token missing", 401);
  }
  const accessToken = await authService.refreshAccessToken(token);
  return successResponse(res, 200, "Access token generated", { accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  const refreshToken = req.cookies.refreshToken;
  await authService.logout(accessToken, refreshToken);
  res.clearCookie("refreshToken");
  return successResponse(res, 200, "Logout successful");
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
