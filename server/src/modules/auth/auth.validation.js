import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    phone: z.string().optional(),
    role: z
      .enum([
        "OWNER",
        "ADMIN",
        "SALES_MANAGER",
        "ACCOUNT_MANAGER",
        "FINANCE_MANAGER",
        "HR",
        "EMPLOYEE",
        "CLIENT",
      ])
      .optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    otpCode: z.string().min(1, "OTP code is required"),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128),
  }),
});
