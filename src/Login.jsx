import { useState } from "react"
import { supabase } from "./supabase"
import "./Login.css"

export default function Login() {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleEmailAuth = async () => {
    if (!email || !password) return setError("Please fill all fields!")
    if (mode === "signup" && !username) return setError("Username is required!")
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, full_name: fullName }
          }
        })
        if (error) throw error
        setSuccess("Account created! Please check your email and click the verification link, then come back to login.")
        setMode("login")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-box">

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo.png" alt="QueryGenie" style={{width: "80px", height: "80px", borderRadius: "16px"}} />
          </div>
          <h1>QueryGenie</h1>
          <p>Query your database with plain English & voice</p>
        </div>

        {/* Mode toggle */}
        <div className="mode-toggle">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => { setMode("login"); setError(""); setSuccess("") }}
          >Login</button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => { setMode("signup"); setError(""); setSuccess("") }}
          >Sign Up</button>
        </div>

        {/* Google button */}
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        <div className="divider"><span>or</span></div>

        {/* Form */}
        <div className="login-form">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
          />

          {error && <div className="login-error">⚠️ {error}</div>}
          {success && <div className="login-success">✅ {success}</div>}

          <button className="submit-btn" onClick={handleEmailAuth} disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
          </button>
        </div>

        <p className="login-footer">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess("") }}>
            {mode === "login" ? " Sign up" : " Login"}
          </span>
        </p>

      </div>
    </div>
  )
}