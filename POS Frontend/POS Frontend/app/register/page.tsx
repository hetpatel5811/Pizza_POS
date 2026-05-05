// "use client";

// import { useMemo, useState } from "react";
// import { registerUser } from "@/lib/api/auth";
// import { useRouter } from "next/navigation";
// import useAuth from "@/hooks/useAuth";

// export default function RegisterPage() {
//   const router = useRouter();
//   const { login } = useAuth();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirm_password: "",
//   });

//   const [error, setError] = useState("");
//   const [showPass, setShowPass] = useState(false);
//   const [showConfirmPass, setShowConfirmPass] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const canSubmit = useMemo(() => {
//     return (
//       form.name.trim() &&
//       form.email.trim() &&
//       form.phone.trim() &&
//       form.password.trim() &&
//       form.confirm_password.trim() &&
//       !loading
//     );
//   }, [form, loading]);

//   const handleRegister = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     try {
//       setLoading(true);
//       const res = await registerUser(form); // { access_token, user }
//       login(res.access_token, res.user);
//       const role = res.user?.role;

//       if (role === "admin") router.push("/admin");
//       else if (role === "employee") router.push("/POS");
//       else router.push("/");
//     } catch (err: any) {
//       setError(err.message || "Registration failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#fff7f3] via-white to-[#fff1e8]">
//       <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
//         <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]">
//           <div className="grid grid-cols-1 lg:grid-cols-2">
//             {/* Left / Brand */}
//             <div className="relative hidden lg:block">
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
//                   <span className="text-lg">ðŸ•</span>
//                   <span className="font-medium">Pizza POS</span>
//                 </div>

//                 <h2 className="mt-8 text-3xl font-extrabold leading-tight">
//                   Create your account.
//                 </h2>
//                 <p className="mt-3 text-white/90">
//                   Set up once, then youâ€™re ready to order, manage, or run the POS.
//                 </p>

//                 <div className="mt-10 rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
//                   <p className="text-sm text-white/90">
//                     Keep your password private. If youâ€™re an employee, use your work email.
//                   </p>
//                 </div>

//                 <div className="mt-8 space-y-3 text-sm text-white/90">
//                   <div className="flex items-start gap-3">
//                     <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
//                       âœ“
//                     </span>
//                     <p>Touch-friendly inputs</p>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
//                       âœ“
//                     </span>
//                     <p>Clear validation feedback</p>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
//                       âœ“
//                     </span>
//                     <p>Modern layout that feels premium</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right / Form */}
//             <div className="p-6 sm:p-10">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h1 className="text-2xl font-extrabold text-gray-900">Create account</h1>
//                   <p className="mt-1 text-sm text-gray-600">
//                     Join Pizza POS in under a minute
//                   </p>
//                 </div>

//                 <div className="lg:hidden inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm text-red-700 ring-1 ring-red-100">
//                   <span>ðŸ•</span>
//                   <span className="font-semibold">Pizza POS</span>
//                 </div>
//               </div>

//               <form onSubmit={handleRegister} className="mt-8 space-y-4">
//                 {/* Full Name */}
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-800">Full name</label>
//                   <input
//                     type="text"
//                     placeholder="John Doe"
//                     className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
//                     value={form.name}
//                     onChange={(e) => setForm({ ...form, name: e.target.value })}
//                     autoComplete="name"
//                   />
//                 </div>

//                 {/* Email */}
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-800">Email</label>
//                   <input
//                     type="email"
//                     placeholder="you@company.com"
//                     className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
//                     value={form.email}
//                     onChange={(e) => setForm({ ...form, email: e.target.value })}
//                     autoComplete="email"
//                   />
//                 </div>

//                 {/* Phone */}
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-800">Phone</label>
//                   <input
//                     type="text"
//                     placeholder="(555) 123-4567"
//                     className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
//                     value={form.phone}
//                     onChange={(e) => setForm({ ...form, phone: e.target.value })}
//                     autoComplete="tel"
//                   />
//                 </div>

//                 {/* Password */}
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-800">Password</label>
//                   <div className="relative">
//                     <input
//                       type={showPass ? "text" : "password"}
//                       placeholder="Create a password"
//                       className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-gray-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
//                       value={form.password}
//                       onChange={(e) => setForm({ ...form, password: e.target.value })}
//                       autoComplete="new-password"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPass(!showPass)}
//                       className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
//                       aria-label={showPass ? "Hide password" : "Show password"}
//                     >
//                       {showPass ? "ðŸ™ˆ" : "ðŸ‘ï¸"}
//                     </button>
//                   </div>
//                   <p className="text-xs text-gray-500">
//                     Use a strong password you donâ€™t reuse elsewhere.
//                   </p>
//                 </div>

//                 {/* Confirm Password */}
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-800">Confirm password</label>
//                   <div className="relative">
//                     <input
//                       type={showConfirmPass ? "text" : "password"}
//                       placeholder="Re-enter your password"
//                       className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-gray-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
//                       value={form.confirm_password}
//                       onChange={(e) =>
//                         setForm({ ...form, confirm_password: e.target.value })
//                       }
//                       autoComplete="new-password"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowConfirmPass(!showConfirmPass)}
//                       className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
//                       aria-label={showConfirmPass ? "Hide password" : "Show password"}
//                     >
//                       {showConfirmPass ? "ðŸ™ˆ" : "ðŸ‘ï¸"}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Error */}
//                 {error && (
//                   <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//                     {error}
//                   </div>
//                 )}

//                 {/* Submit */}
//                 <button
//                   type="submit"
//                   disabled={!canSubmit}
//                   className="h-12 w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {loading ? (
//                     <span className="inline-flex items-center gap-2">
//                       <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
//                       Creating account...
//                     </span>
//                   ) : (
//                     "Register"
//                   )}
//                 </button>

//                 <p className="text-center text-sm text-gray-600">
//                   Already have an account?{" "}
//                   <button
//                     type="button"
//                     onClick={() => router.push("/login")}
//                     className="font-semibold text-red-600 hover:text-red-700 hover:underline"
//                   >
//                     Login here
//                   </button>
//                 </p>
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
import { registerUser } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.password.trim() &&
      form.confirm_password.trim() &&
      !loading
    );
  }, [form, loading]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await registerUser(form);
      login(res.access_token, res.user);
      const role = res.user?.role;

      if (role === "admin") router.push("/admin");
      else if (role === "employee") router.push("/POS");
      else router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-lg shadow-md px-8 pt-8 pb-10">
          {/* Simple header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Pizza POS</h2>
            <p className="mt-2 text-sm text-gray-600">Create your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

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
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm_password"
                  type={showConfirmPass ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {showConfirmPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3">
                <p className="text-sm text-red-800">{error}</p>
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
                  Creating account...
                </span>
              ) : (
                "Register"
              )}
            </button>

            {/* Login link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-medium text-red-600 hover:text-red-700"
                >
                  Login here
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
