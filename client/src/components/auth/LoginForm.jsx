"use client";

import { useActionState, useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { loginAction, verifyOtpAction, resendOtpAction } from "@/actions/auth.action";

const initialState = { success: false, message: "" };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otpUserId, setOtpUserId] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(6);
  const [otpExpiryMins, setOtpExpiryMins] = useState(5);
  const [otpValues, setOtpValues] = useState([]);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isVerifying, startVerifying] = useTransition();
  const [isResending, startResending] = useTransition();
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Handle login response — switch to OTP step if needed
  useEffect(() => {
    if (state.success && state.otpRequired) {
      setOtpStep(true);
      setOtpUserId(state.userId);
      setOtpEmail(state.email);
      setOtpDigits(state.digits || 6);
      setOtpExpiryMins(state.expiryMins || 5);
      setOtpValues(new Array(state.digits || 6).fill(""));
      setCountdown((state.expiryMins || 5) * 60);
      setOtpError("");
      setOtpSuccess(state.message || "OTP sent to your email");
      // Focus first input after render
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          clearInterval(timer);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1); // Only keep last digit
    setOtpValues(newValues);
    setOtpError("");

    // Auto-focus next input
    if (value && index < otpDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (value && index === otpDigits - 1 && newValues.every((v) => v)) {
      handleVerifyOtp(newValues.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, otpDigits);
    if (!pasted) return;
    const newValues = [...otpValues];
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i];
    }
    setOtpValues(newValues);
    // Focus last filled or the next empty
    const focusIdx = Math.min(pasted.length, otpDigits - 1);
    inputRefs.current[focusIdx]?.focus();
    // Auto-submit if fully pasted
    if (newValues.every((v) => v)) {
      handleVerifyOtp(newValues.join(""));
    }
  };

  const handleVerifyOtp = (code) => {
    startVerifying(async () => {
      const result = await verifyOtpAction(otpUserId, code);
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setOtpError(result.message || "Invalid OTP");
        setOtpValues(new Array(otpDigits).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    });
  };

  const handleResendOtp = () => {
    startResending(async () => {
      setOtpError("");
      const result = await resendOtpAction(otpUserId);
      if (result.success) {
        setOtpSuccess("New OTP sent to your email");
        setCountdown((result.expiryMins || otpExpiryMins) * 60);
        setOtpValues(new Array(otpDigits).fill(""));
        setTimeout(() => {
          setOtpSuccess("");
          inputRefs.current[0]?.focus();
        }, 3000);
      } else {
        setOtpError(result.message || "Failed to resend OTP");
      }
    });
  };

  const handleBackToLogin = () => {
    setOtpStep(false);
    setOtpUserId(null);
    setOtpEmail("");
    setOtpValues([]);
    setOtpError("");
    setOtpSuccess("");
  };

  // ────────────────────────────────────────────────────────
  // OTP Verification Step
  // ────────────────────────────────────────────────────────
  if (otpStep) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBackToLogin}
          className="flex items-center gap-2 text-sm text-gray hover:text-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        {/* OTP Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-[22px] font-semibold text-dark tracking-[-0.44px]">
            Verify your identity
          </h3>
          <p className="text-gray text-[14px] mt-2 leading-[150%]">
            We sent a {otpDigits}-digit code to{" "}
            <span className="font-medium text-dark">{otpEmail}</span>
          </p>
        </div>

        {/* Success Message */}
        {otpSuccess && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-[12px]">
            <p className="text-sm text-emerald-600 font-medium">{otpSuccess}</p>
          </div>
        )}

        {/* Error Message */}
        {otpError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-[12px]">
            <p className="text-sm text-red-600 font-medium">{otpError}</p>
          </div>
        )}

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
          {otpValues.map((value, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={value}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              disabled={isVerifying}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none ${
                value
                  ? "border-indigo-500 bg-indigo-50/50 text-indigo-700"
                  : "border-border-1 bg-light-gray text-dark"
              } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50`}
            />
          ))}
        </div>

        {/* Countdown Timer */}
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-sm text-gray">
              Code expires in{" "}
              <span className="font-semibold text-indigo-600">{formatTime(countdown)}</span>
            </p>
          ) : (
            <p className="text-sm text-red-500 font-medium">Code has expired</p>
          )}
        </div>

        {/* Verify Button */}
        <button
          type="button"
          onClick={() => handleVerifyOtp(otpValues.join(""))}
          disabled={isVerifying || otpValues.some((v) => !v)}
          className="btn-glow w-full py-3.5 bg-dark hover:bg-primary disabled:opacity-50 text-white font-semibold text-[16px] rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="relative z-10">Verifying...</span>
            </>
          ) : (
            <span className="relative z-10">Verify & Sign In</span>
          )}
        </button>

        {/* Resend */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || countdown > 0}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            {isResending ? "Resending..." : "Resend OTP"}
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // Standard Login Form
  // ────────────────────────────────────────────────────────
  return (
    <form action={formAction} className="space-y-5">
      {/* Error Alert */}
      {state.message && !state.success && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-[12px]">
          <p className="text-sm text-red-600 font-medium">{state.message}</p>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-[14px] font-semibold text-dark mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full pl-11 pr-4 py-3.5 bg-light-gray border border-border-1 rounded-full text-[15px] text-dark placeholder-gray/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-[14px] font-semibold text-dark">
            Password
          </label>
          <a href="#" className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="w-full pl-11 pr-12 py-3.5 bg-light-gray border border-border-1 rounded-full text-[15px] text-dark placeholder-gray/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-dark transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-glow w-full py-3.5 bg-dark hover:bg-primary disabled:opacity-50 text-white font-semibold text-[16px] rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="relative z-10">Signing in...</span>
          </>
        ) : (
          <span className="relative z-10">Sign in</span>
        )}
      </button>
    </form>
  );
}
