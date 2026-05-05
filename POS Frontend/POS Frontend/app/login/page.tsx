// "use client";

// import { useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import useAuth from "@/hooks/useAuth";
// import { loginUser } from "@/lib/api/auth";

// export default function LoginPage() {
//   const router = useRouter();
//   const { login } = useAuth();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [err, setErr] = useState("");
//   const [showPass, setShowPass] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const canSubmit = useMemo(() => {
//     return email.trim().length > 0 && password.trim().length > 0 && !loading;
//   }, [email, password, loading]);

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErr("");

//     try {
//       setLoading(true);
//       const data = await loginUser({ email, password });
//       login(data.access_token, data.user);

//       const role = (data.user?.role || "").toLowerCase();
//       if (role === "admin") router.replace("/admin");
//       else if (role === "employee") router.replace("/POS");
//       else router.replace("/");
//     } catch (e: any) {
//       setErr(e?.message || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#fff7f3] via-white to-[#fff1e8]">
//       <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
//         <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]">
//           <div className="grid grid-cols-1 md:grid-cols-2">
//             {/* Left / Brand */}
//             <div className="relative hidden md:block">
//               <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-500 to-amber-400" />
//               <div className="absolute inset-0 opacity-20">
//                 <div
//                   className="h-full w-full"
//                   style={{
//                     backgroundImage:
//                       "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.9) 1px, transparent 1px)",
//                     backgroundSize: "18px 18px",
//                   }}
//                 />
//               </div>

//               <div className="relative h-full p-10 text-white">
//                 <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm ring-1 ring-white/20">
//                   <span className="text-lg">🍕</span>
//                   <span className="font-medium">Pizza POS</span>
//                 </div>

//                 <h2 className="mt-8 text-3xl font-extrabold leading-tight">
//                   Sign in and get back to service.
//                 </h2>
//                 <p className="mt-3 text-white/90">
//                   Fast, touch-friendly, and built for busy shifts — tablet or desktop.
//                 </p>

//                 <div className="mt-10 space-y-3 text-sm text-white/90">
//                   <div className="flex items-start gap-3">
//                     <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
//                       ✓
//                     </span>
//                     <p>Quick access for Admins and Employees</p>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
//                       ✓
//                     </span>
//                     <p>Clean layout with clear error feedback</p>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
//                       ✓
//                     </span>
//                     <p>Large inputs for POS screens</p>
//                   </div>
//                 </div>

//                 <div className="mt-12 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
//                   <p className="text-sm text-white/90">
//                     Tip: Use your work email to sign in. If you’re new, create an account in seconds.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Right / Form */}
//             <div className="p-6 sm:p-10">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
//                   <p className="mt-1 text-sm text-gray-600">Sign in to continue</p>
//                 </div>
//                 <div className="md:hidden inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm text-red-700 ring-1 ring-red-100">
//                   <span>🍕</span>
//                   <span className="font-semibold">Pizza POS</span>
//                 </div>
//               </div>

//               <form onSubmit={onSubmit} className="mt-8 space-y-4">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-800">Email</label>
//                   <div className="relative">
//                     <input
//                       className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
//                       placeholder="you@company.com"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       autoComplete="email"
//                     />
//                     <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
//                       @
//                     </span>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-800">Password</label>
//                   <div className="relative">
//                     <input
//                       className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-gray-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
//                       placeholder="••••••••"
//                       type={showPass ? "text" : "password"}
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       autoComplete="current-password"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPass((s) => !s)}
//                       className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
//                       aria-label={showPass ? "Hide password" : "Show password"}
//                     >
//                       {showPass ? "🙈" : "👁️"}
//                     </button>
//                   </div>
//                 </div>

//                 {err && (
//                   <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//                     {err}
//                   </div>
//                 )}

//                 <button
//                   className="h-12 w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
//                   type="submit"
//                   disabled={!canSubmit}
//                 >
//                   {loading ? (
//                     <span className="inline-flex items-center gap-2">
//                       <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
//                       Signing in...
//                     </span>
//                   ) : (
//                     "Sign in"
//                   )}
//                 </button>

//                 <div className="flex items-center justify-between pt-2 text-sm">
//                   <button
//                     type="button"
//                     className="text-gray-600 hover:text-gray-900 hover:underline"
//                     onClick={() => router.push("/forgot-password")}
//                   >
//                     Forgot password?
//                   </button>

//                   <span className="text-gray-600">
//                     New user?{" "}
//                     <button
//                       type="button"
//                       className="font-semibold text-red-600 hover:text-red-700 hover:underline"
//                       onClick={() => router.push("/register")}
//                     >
//                       Register
//                     </button>
//                   </span>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { loginUser } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    try {
      setLoading(true);
      const data = await loginUser({ email, password });
      login(data.access_token, data.user);

      const role = (data.user?.role || "").toLowerCase();
      if (role === "admin") router.replace("/admin");
      else if (role === "employee") router.replace("/POS");
      else router.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md px-8 pt-8 pb-10">
          {/* Simple header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Pizza POS</h2>
            <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error message */}
            {err && (
              <div className="rounded-md bg-red-50 px-4 py-3">
                <p className="text-sm text-red-800">{err}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-md bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Links */}
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="font-medium text-gray-600 hover:text-gray-900"
              >
                Forgot password?
              </button>
              <span className="text-gray-600">
                New user?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="font-medium text-red-600 hover:text-red-700"
                >
                  Register
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}