"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, signInWithGoogle, logout } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
      });

      return () => unsubscribe();
  }, []);

  return (
      <html lang="en" style={{ overflow: "hidden", height: "100vh", width: "100vw" }}>
          <body style={{ margin: 0, padding: 0, overflow: "hidden", height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
              
              {/* ✅ Fixed Navbar Height */}
              <nav style={{
                  height: "50px",  /* ✅ Set a fixed height */
                  minHeight: "50px",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px",
                  borderBottom: "1px solid #ddd",
                  background: "#fff"
              }}>
                  <Link href="/">🏠 Home</Link>
                  <Link href="/upload">📤 Upload</Link>
                  <Link href="/feed">🎬 Feed</Link>

                  <div style={{ marginLeft: "auto" }}>
                      {user ? (
                          <>
                              <span>👤 {user.displayName}</span>
                              <button onClick={logout} style={{ marginLeft: "10px", cursor: "pointer" }}>🚪 Logout</button>
                          </>
                      ) : (
                          <button onClick={signInWithGoogle} style={{ cursor: "pointer" }}>🔑 Sign in with Google</button>
                      )}
                  </div>
              </nav>

              {/* ✅ Ensure the Main Content Fills the Remaining Space */}
              <main style={{
                  flex: 1,  /* ✅ Takes remaining space */
                  overflowY: "auto",
                  padding: "20px"
              }}>
                  {children}
              </main>
          </body>
      </html>
  );
}
