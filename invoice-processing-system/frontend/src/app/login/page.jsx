"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth.store";
import { Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, signup } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic Validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (!isLogin && !name) {
      setError("Please enter your name.");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (isLogin) {
        login(email);
      } else {
        signup(email, name);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper animate-fade-in-up">
        
        {/* Decorative elements */}
        <div className="auth-card-blob auth-card-blob--1"></div>
        <div className="auth-card-blob auth-card-blob--2"></div>
        
        <div className="auth-card">
          <div className="auth-card__header">
            <Link href="/" className="auth-logo">
              <span className="brand-mark__badge font-bold">CT</span>
              <span><strong>ClearTax</strong></span>
            </Link>
            <h1 className="auth-title">
              {success ? "Success!" : isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="auth-subtitle">
              {success 
                ? "Redirecting to workspace..." 
                : isLogin 
                  ? "Access your invoice processing dashboard" 
                  : "Start processing invoices in minutes"}
            </p>
          </div>

          {success ? (
            <div className="auth-success-state">
              <div className="success-icon-wrapper">
                <CheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
              </div>
              <p className="text-center font-medium mt-4 text-emerald-800">
                Logged in successfully!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-error-banner">
                  <span>{error}</span>
                </div>
              )}

              {/* Name Field (Sign Up Only) */}
              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="name">Full Name</label>
                  <div className="auth-input-wrapper">
                    <User className="auth-input-icon" />
                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="auth-field">
                <label htmlFor="email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-field">
                <div className="auth-field-header">
                  <label htmlFor="password">Password</label>
                  {isLogin && (
                    <a href="#" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>
                      Forgot?
                    </a>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? (
                  <span className="flex items-center gap-2">
                    Processing...
                  </span>
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>

              <div className="auth-toggle">
                <span>
                  {isLogin ? "New to ClearTax?" : "Already have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="auth-toggle-btn"
                >
                  {isLogin ? "Create an account" : "Sign in instead"}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer-note">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure 256-bit SSL encrypted connection.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
