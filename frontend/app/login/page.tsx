"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {  getSession } from "@/lib/api";

export default function Page() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [csrfToken, setCsrfToken] = useState("");

  const [loadingProvider] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/auth/csrf`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken));
    getSession().then((session) => {
      if (session) {
        router.replace("/workspace");
      } else {
        setIsLoading(false); // no session — show the login form
      }
    });
  }, []);
  const router = useRouter();
  async function handleSocialSignin(provider:string) {
    const res = await fetch(`/auth/csrf`, {
      credentials: "include",
    });
    const { csrfToken } = await res.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/auth/signin/${provider}`;

    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "csrfToken";
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);

    document.body.appendChild(form);
    form.submit();
  }
  if (isLoading) {
    return (
      <div>loading plzz wait.............</div>
    )
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-indigo-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form action={`/auth/callback/credentials`} method="POST" className="space-y-5">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >

                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
          {error && (
            <div className="text-red-500 text-center text-sm mb-4">{error}</div>
          )}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Register
            </Link>
          </div>
          <div className="w-full max-w-xs mx-auto py-5">
            <div className="flex items-center mb-5">
              <div className="grow border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500 font-medium">
                Sign in with
              </span>
              <div className="grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-3">
              {["google", "discord", "github"].map((provider) => (
                <button
                  onClick={() => {
                    handleSocialSignin(provider);
                  }}
                  key={provider}
                  disabled={loadingProvider !== null}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg transition-all duration-200 ${loadingProvider === provider
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                    } ${provider === "google"
                      ? "border-gray-300 bg-white hover:border-blue-500 hover:bg-gray-50"
                      : provider === "discord"
                        ? "border-gray-300 bg-white hover:border-indigo-500 hover:bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-800 hover:bg-gray-50"
                    }`}
                >
                  {loadingProvider === provider ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {provider === "google" && (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      {provider === "discord" && (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill="#5865F2"
                            d="M19.73 4.87a18.2 18.2 0 0 0-4.6-1.44c-.21.4-.4.8-.58 1.21a16.55 16.55 0 0 0-4.94 0c-.18-.41-.37-.82-.59-1.21-1.62.27-3.14.75-4.6 1.44C2.2 9.1 1.55 13.2 1.86 17.24a18.5 18.5 0 0 0 5.63 2.79c.45-.6.85-1.24 1.2-1.92a11.8 11.8 0 0 1-1.92-.92c.16-.12.32-.24.47-.36 3.68 1.72 7.67 1.72 11.3 0 .15.12.31.24.47.36-.62.37-1.27.7-1.93.92.35.68.75 1.32 1.2 1.92a18.5 18.5 0 0 0 5.63-2.79c.4-4.53-.7-8.6-2.84-12.37zM8.7 14.8c-1.1 0-2-1.02-2-2.27 0-1.25.88-2.27 2-2.27 1.1 0 2.02 1.02 2 2.27 0 1.25-.9 2.27-2 2.27zm6.6 0c-1.1 0-2-1.02-2-2.27 0-1.25.88-2.27 2-2.27 1.1 0 2.02 1.02 2 2.27 0 1.25-.9 2.27-2 2.27z"
                          />
                        </svg>
                      )}
                      {provider === "github" && (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill="#333"
                            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
                          />
                        </svg>
                      )}
                    </>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {loadingProvider === provider
                      ? "Connecting..."
                      : provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}