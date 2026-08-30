'use client'

import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export default function Page() {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [firstName, setfirstName] = useState<string>('')
    const [lastName, setlastName] = useState<string>('')
    const [confirmpassword, setconfirmpassword] = useState<string>('')
    const [error, seterror] = useState<string>('')
    const router = useRouter()

    const handlesumit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.includes('@gmail.com')) {
            seterror("email is invalid")
            return
        }
        if (email.trim() === "" || password.trim().length < 7 || confirmpassword.trim().length < 7) {
            seterror("email or password is missing")
            return
        }
        if (password !== confirmpassword) {
            alert("password not match")
            return
        }
        try {
            const res = await apiFetch('/api/register', {
                method: "POST",
                body: JSON.stringify({ email, password, firstName, lastName })
            })

           

            if (!res.ok) {
                console.log(res.error, res)
                seterror(res.error)
                throw new Error(res.error)

            } else {
                router.push('/login')
            }
        } catch (error) {
            console.error("Error:", error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                        <p className="text-gray-600">Sign up to get started</p>
                    </div>

                    <form onSubmit={handlesumit} className="space-y-5">
                        <div>
                            <label htmlFor="first name" className="block text-sm font-medium text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setfirstName(e.target.value)}
                                placeholder='Enter your first name'
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setlastName(e.target.value)}
                                placeholder='Enter your last name'
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='Enter your email'
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='Enter your password'
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmpassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmpassword"
                                id="confirmpassword"
                                value={confirmpassword}
                                onChange={(e) => setconfirmpassword(e.target.value)}
                                placeholder='Confirm your password'
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Register
                        </button>
                    </form>
                    <div className="text-red-500 text-center">{error}</div>
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}