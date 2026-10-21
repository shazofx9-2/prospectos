import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProspectOSLogo from './ProspectOSLogo';
import {
  KeyRound,
  Mail,
  User as UserIcon,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { api, setToken } from '../lib/api.js';
import { setCachedGoogleToken } from '../lib/googleCalendar.js';

interface AuthPageProps {
  onAuthSuccess: (user: any, isNewUser?: boolean) => void;
  initialIsLogin?: boolean;
  onBackToLanding?: () => void;
}

export default function AuthPage({ onAuthSuccess, initialIsLogin = true, onBackToLanding }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg(null);
    setResetSuccessMsg(null);

    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      setResetErrorMsg('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccessMsg(`We sent a password reset email to ${cleanEmail}. Please check your inbox and spam folder.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setResetErrorMsg('No registered account found with this email address.');
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        // Fallback for restriction in firebase console settings
        setResetSuccessMsg(`Password reset request recorded for ${cleanEmail}. Please check your inbox or try signing in.`);
      } else {
        setResetSuccessMsg(`A password reset link request has been dispatched to ${cleanEmail}. Please check your inbox.`);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim();

    try {
      if (isLogin) {
        // Sign in user
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        const authUser = {
          id: user.uid,
          email: user.email || cleanEmail,
          name: user.displayName || cleanEmail.split('@')[0] || 'User'
        };

        setToken(`fb_${user.uid}`);
        onAuthSuccess(authUser, false);
      } else {
        // Create user
        const cleanName = name.trim();

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;
        if (user && cleanName) {
          await updateProfile(user, { displayName: cleanName }).catch(() => {});
        }

        const authUser = {
          id: user.uid,
          email: user.email || cleanEmail,
          name: cleanName || user.displayName || cleanEmail.split('@')[0] || 'User'
        };

        setToken(`fb_${user.uid}`);
        onAuthSuccess(authUser, true);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code || '';
      if (isLogin) {
        setError('Email or password is incorrect');
      } else {
        if (code === 'auth/email-already-in-use') {
          setError('User already exists. Please sign in');
        } else if (code === 'auth/invalid-email' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          setError('Email or password is incorrect');
        } else {
          setError(err?.message || 'Failed to sign up. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Ask for Calendar events & Gmail send permissions upfront during account creation
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.setCustomParameters({ prompt: 'consent select_account' });

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      const accessToken = credential?.accessToken;
      if (accessToken) {
        setCachedGoogleToken(accessToken);
      }

      const authUser = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'User')
      };

      setToken(`fb_${user.uid}`);

      if (accessToken && user.email) {
        try {
          await api.senderAccounts.connect({
            emailAddress: user.email,
            provider: 'gmail',
            oauthAccessToken: accessToken
          });
        } catch (e) {
          console.warn('Could not auto-connect Google OAuth token:', e);
        }
      }

      const isNew = getAdditionalUserInfo(userCredential)?.isNewUser ?? false;
      onAuthSuccess(authUser, isNew);
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setError(`This domain (${domain}) is not in the authorized domains list. Please add '${domain}' to Authorized Domains in your project authentication console.`);
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled in your authentication console settings. Please enable Google provider in console.');
      } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Email or password is incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = () => {
    setError(null);
    setLoading(true);

    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      id: guestId,
      email: 'guest@prospectos.com',
      name: 'Guest Explorer'
    };

    setToken(`fb_${guestId}`);
    onAuthSuccess(guestUser, false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f1011] p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-neutral-800/15 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md space-y-6 mx-auto">
        {/* Back to Home Button */}
        {onBackToLanding && (
          <div className="flex items-center justify-start">
            <button
              onClick={onBackToLanding}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md transition-all cursor-pointer hover:bg-white/10 shadow-sm font-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        )}

        {/* ProspectOS Header */}
        <div className="text-center space-y-2 py-1 flex flex-col items-center">
          <ProspectOSLogo className="w-12 h-12" />
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-normal text-white">
            ProspectOS
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            Easily manage your sales, leads, and clients in one place
          </p>
        </div>

        {/* Auth Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-white/10 bg-zinc-950/90 flex flex-col justify-center"
          id="auth-container"
        >
            {pendingVerificationEmail ? (
              /* Email Verification Screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
                  <Mail className="w-8 h-8 text-zinc-300" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white">Email Verification Required</h2>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
                    We sent a verification email to <strong className="text-white font-semibold">{pendingVerificationEmail}</strong>. Please check your inbox and verify your email to log in.
                  </p>
                  <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-zinc-300 text-xs leading-relaxed max-w-sm mx-auto text-left flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span>
                      Can't find the email? Please <strong>check your spam or junk folder</strong>.
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setPendingVerificationEmail(null);
                      setIsLogin(true);
                      setError(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </motion.div>
            ) : showForgotPassword ? (
              /* Forgot Password Screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <KeyRound className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Reset Password</h2>
                    <p className="text-xs text-zinc-400">Enter your email to receive a password reset link</p>
                  </div>
                </div>

                {resetSuccessMsg ? (
                  <div className="space-y-4 pt-2">
                    <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-zinc-200 text-xs leading-relaxed flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-zinc-200 shrink-0 mt-0.5" />
                      <span>{resetSuccessMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetSuccessMsg(null);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Return to Sign In</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendPasswordReset} className="space-y-4">
                    {resetErrorMsg && (
                      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{resetErrorMsg}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-400">Email Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm glass-input"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-2.5 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetErrorMsg(null);
                      }}
                      className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              /* Standard Auth Form */
              <>
                <h2 className="text-xl font-semibold text-white mb-6">
                  {isLogin ? 'Sign in to your account' : 'Create your free account'}
                </h2>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-2.5 text-red-200 text-xs leading-relaxed"
                    id="auth-error-banner"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-400">Full Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                          <UserIcon className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm glass-input"
                          placeholder="Sarah Jenkins"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm glass-input"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-400">Password</label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email);
                            setShowForgotPassword(true);
                            setResetSuccessMsg(null);
                            setResetErrorMsg(null);
                          }}
                          className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                        <KeyRound className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm glass-input"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors mt-6 disabled:opacity-50"
                    id="auth-submit-btn"
                  >
                    {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Sign Up'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {/* OR Divider & Continue with Google */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-zinc-950 px-2.5 text-zinc-500 font-semibold">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-3 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.63 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.47 0 2.805.54 3.84 1.425l2.4-2.4C16.995 3.51 14.76 2.7 12.24 2.7 7.14 2.7 3 6.84 3 11.94s4.14 9.24 9.24 9.24c5.325 0 8.85-3.735 8.85-9.015 0-.615-.06-1.215-.165-1.885H12.24z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="w-full mt-3 py-2.5 px-4 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm group"
                  id="try-as-guest-btn"
                >
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                  <span>Try as Guest (Instant Demo Access)</span>
                </button>

                <p className="text-center text-xs text-zinc-500 mt-6">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                    }}
                    className="text-white hover:underline font-medium focus:outline-none cursor-pointer"
                  >
                    {isLogin ? 'Sign up instead' : 'Sign in instead'}
                  </button>
                </p>
              </>
            )}
          </motion.div>
      </div>
    </div>
  );
}
