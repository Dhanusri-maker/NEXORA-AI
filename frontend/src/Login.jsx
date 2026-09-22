import { useState } from "react";
import { login, signUp } from "./lib/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isSignup) {
        await signUp(email, password);
        setMessage("Account created successfully! 🚀");
      } else {
        await login(email, password);
        setMessage("Login successful! 🚀");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #1d2854 0%, #090b18 45%, #03040a 100%)",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        boxSizing: "border-box",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "40px 32px",
          borderRadius: "24px",
          background: "rgba(15, 18, 35, 0.88)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
          backdropFilter: "blur(15px)",
          boxSizing: "border-box",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "8px",
            }}
          >
            🤖
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: "800",
              letterSpacing: "2px",
              background:
                "linear-gradient(90deg, #7c5cff, #00d4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            NEXORA AI
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#9da5c0",
              fontSize: "14px",
            }}
          >
            {isSignup
              ? "Create your AI account"
              : "Your intelligent AI companion"}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#cbd2ea",
              fontSize: "14px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "14px 16px",
              marginBottom: "18px",
              borderRadius: "12px",
              border: "1px solid #303752",
              outline: "none",
              background: "#0b0e1c",
              color: "white",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#cbd2ea",
              fontSize: "14px",
            }}
          >
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "14px 16px",
              marginBottom: "22px",
              borderRadius: "12px",
              border: "1px solid #303752",
              outline: "none",
              background: "#0b0e1c",
              color: "white",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background:
                "linear-gradient(90deg, #6c4cff, #00bfff)",
              color: "white",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 8px 25px rgba(80,100,255,0.25)",
            }}
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account 🚀"
              : "Login →"}
          </button>
        </form>

        {/* MESSAGE */}
        {message && (
          <div
            style={{
              marginTop: "18px",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              color: "#d9def0",
              textAlign: "center",
              fontSize: "13px",
              wordBreak: "break-word",
            }}
          >
            {message}
          </div>
        )}

        {/* TOGGLE */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#8f98b5",
            fontSize: "14px",
          }}
        >
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage("");
            }}
            style={{
              marginLeft: "7px",
              border: "none",
              background: "transparent",
              color: "#6ecbff",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {isSignup ? "Login" : "Create Account"}
          </button>
        </div>

        {/* FOOTER */}
        <p
          style={{
            textAlign: "center",
            marginTop: "30px",
            marginBottom: 0,
            color: "#555d78",
            fontSize: "11px",
          }}
        >
          Powered by NEXORA AI
        </p>
      </div>
    </div>
  );
}

export default Login;