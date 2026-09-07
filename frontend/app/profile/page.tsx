"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Zap, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

const ProfileIcon = ({ className = "w-5 h-5" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
    </svg>
);

const SecurityIcon = ({ className = "w-5 h-5" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
    </svg>
);

const ActivityIcon = ({ className = "w-5 h-5" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
    </svg>
);

const VerifiedIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
        />
    </svg>
);

interface userdata {
    firstName: string;
    lastName: string;
    email: string;
    hasPassword: boolean;
    googleId: string;
    githubId: string;
    discordId: string;
    authMethods: string[];
    profileImage?: string;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
    linkedAccounts: {
        google: boolean;
        github: boolean;
        discord: boolean;
        credentials: boolean;
    };
}

export default function AccountProfile() {
    const router = useRouter();
    const [adminerror, setadminerror] = useState<string>("");
    const [user, setUser] = useState<userdata>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>("profile");
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>("");
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [error, seterror] = useState<boolean>(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/user");
                console.log(response);
                if (!response.ok) {
                    seterror(true);
                    throw new Error("Failed to fetch profile data");
                }
                const userData = await response.json();
                if (!userData) {
                    seterror(true);
                    setUser(undefined);
                    return;
                }
                seterror(false);
                setUser(userData);
            } catch (error) {
                seterror(true);
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    async function handleLogout() {
        const res = await fetch(`/auth/csrf`, { credentials: "include" });
        const { csrfToken } = await res.json();

        const form = document.createElement("form");
        form.method = "POST";
        form.action = `/auth/signout`;

        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "csrfToken";
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        document.body.appendChild(form);
        form.submit();
    }

    const handleDeleteAccount = async () => {
        const deleteuser = await fetch('/api/user', {
            method: "DELETE",
            headers: { 'Content-Type': "application/json" },
            body: JSON.stringify({ email: user?.email })
        })
        if (deleteuser.ok) {
            await handleLogout()

        }
    };

    const getProviderIcon = (provider: string) => {
        const icons: any = {
            google: (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            ),
            github: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
            ),
            credentials: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
            ),
        };
        return icons[provider] || null;
    };

    const tabs = [
        { id: "profile", name: "Profile", icon: ProfileIcon },
        { id: "security", name: "Security", icon: SecurityIcon },
        { id: "activity", name: "Activity", icon: ActivityIcon },
    ];

    const AppHeader = () => (
        <header className="relative z-20 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
            <div className="max-w-full mx-auto px-6">
                <div className="flex items-center h-14">
                    <Link href="/workspace" className="flex items-center gap-2 group">
                        <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-base font-medium tracking-tight group-hover:text-zinc-300 transition-colors">
                            WebhookLab
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <div className="pointer-events-none fixed inset-0 grid-pattern" />
                <AppHeader />
                <div className="relative z-10 flex-1 flex items-center justify-center p-6">
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-10 max-w-md w-full text-center">
                        <div className="w-14 h-14 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <h2 className="text-[16px] font-semibold text-white mb-2">
                            Failed to load profile
                        </h2>
                        <p className="text-[13px] text-zinc-400 mb-6 leading-relaxed">
                            We couldn&apos;t fetch your profile data. This might be a temporary
                            issue.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center gap-2 w-full font-medium text-[13px] rounded-lg px-5 py-2.5 bg-white text-black hover:bg-zinc-200 transition-colors"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M23 4v6h-6M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
                            </svg>
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <div className="pointer-events-none fixed inset-0 grid-pattern" />
                <AppHeader />
                <div className="relative z-10 flex-1 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                </div>
            </div>
        );
    }

    return (



        <ProtectedRoute>

            <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white/20">
                <div className="pointer-events-none fixed inset-0 grid-pattern" />
                <AppHeader />

                <main className="relative z-10 flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        {/* Top stat cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 lg:mb-8">
                            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-medium text-zinc-400 truncate">
                                            Account Status
                                        </p>
                                        <p className="text-[20px] font-semibold text-white mt-1">
                                            {user?.isActive ? "Active" : "Inactive"}
                                        </p>
                                    </div>
                                    <div className="w-11 h-11 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center shrink-0 ml-3">
                                        <div
                                            className={`w-2.5 h-2.5 rounded-full ${user?.isActive ? "bg-green-400" : "bg-zinc-500"}`}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-medium text-zinc-400 truncate">
                                            Email Verification
                                        </p>
                                        <p className="text-[20px] font-semibold text-white mt-1">
                                            {user?.isEmailVerified ? "Verified" : "Pending"}
                                        </p>
                                    </div>
                                    <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shrink-0 ml-3">
                                        {user?.isEmailVerified ? (
                                            <VerifiedIcon className="w-5 h-5 text-blue-400" />
                                        ) : (
                                            <SecurityIcon className="w-5 h-5 text-zinc-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-medium text-zinc-400 truncate">
                                            Member Since
                                        </p>
                                        <p className="text-[20px] font-semibold text-white mt-1">
                                            {user?.createdAt
                                                ? new Date(user.createdAt).getFullYear()
                                                : "N/A"}
                                        </p>
                                    </div>
                                    <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center shrink-0 ml-3">
                                        <svg
                                            className="w-5 h-5 text-purple-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                            {/* Sidebar */}
                            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
                                <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5 text-center">
                                    <div className="relative inline-block mb-4">
                                        <div className="w-18 h-18 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center overflow-hidden mx-auto">
                                            {user?.profileImage ? (
                                                <Image
                                                    src={user.profileImage}
                                                    alt="Profile"
                                                    width={72}
                                                    height={72}
                                                    className="rounded-full object-cover w-full h-full"
                                                />
                                            ) : (
                                                <ProfileIcon className="w-8 h-8 text-zinc-500" />
                                            )}
                                        </div>
                                        {user?.isEmailVerified && (
                                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black">
                                                <VerifiedIcon className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="text-[15px] font-semibold text-white mb-1 truncate px-2">
                                        {user?.firstName} {user?.lastName}
                                    </h2>
                                    <p className="text-zinc-400 text-[13px] mb-4 truncate px-2">
                                        {user?.email}
                                    </p>

                                    {user?.isActive && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Active
                                        </span>
                                    )}
                                </div>

                                <nav className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-3">
                                    <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
                                        Navigation
                                    </h3>
                                    <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex-1 lg:flex-none lg:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-left transition-colors whitespace-nowrap ${activeTab === tab.id
                                                    ? "bg-white/[0.08] text-white"
                                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                                                    }`}
                                            >
                                                <tab.icon
                                                    className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : "text-zinc-500"}`}
                                                />
                                                <span className="font-medium text-[13px]">
                                                    {tab.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </nav>
                            </div>

                            {/* Main content */}
                            <div className="lg:col-span-3">
                                {activeTab === "profile" && (
                                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg">
                                        <div className="p-6 lg:p-8 border-b border-white/[0.08]">
                                            <h2 className="text-[18px] font-semibold text-white">
                                                Profile Information
                                            </h2>
                                            <p className="text-zinc-400 text-[13px] mt-1.5">
                                                Manage your personal information and account details
                                            </p>
                                        </div>

                                        <div className="p-6 lg:p-8 space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                                                        First Name
                                                    </label>
                                                    <div className="p-3.5 text-white bg-white/[0.03] rounded-lg border border-white/[0.08] text-[14px]">
                                                        {user?.firstName || "Not provided"}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                                                        Last Name
                                                    </label>
                                                    <div className="p-3.5 text-white bg-white/[0.03] rounded-lg border border-white/[0.08] text-[14px]">
                                                        {user?.lastName || "Not provided"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                                                    Email Address
                                                </label>
                                                <div className="p-3.5 bg-white/[0.03] rounded-lg border border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <span className="text-white text-[14px] truncate">
                                                        {user?.email}
                                                    </span>
                                                    {user?.isEmailVerified && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 w-fit">
                                                            <VerifiedIcon className="w-3 h-3 mr-1" />
                                                            Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-white/[0.08]">
                                                <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">
                                                    Actions
                                                </h3>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full sm:w-auto px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-[13px]"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                            />
                                                        </svg>
                                                        <span>Logout</span>
                                                    </button>

                                                    <button
                                                        onClick={() => setShowDeleteModal(true)}
                                                        className="w-full sm:w-auto px-4 py-2.5 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center justify-center gap-2 text-[13px]"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                        <span>Delete Account</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg">
                                        <div className="p-6 lg:p-8 border-b border-white/[0.08]">
                                            <h2 className="text-[18px] font-semibold text-white">
                                                Security Settings
                                            </h2>
                                            <p className="text-zinc-400 text-[13px] mt-1.5">
                                                Manage your connected accounts and security preferences
                                            </p>
                                        </div>

                                        <div className="p-6 lg:p-8 space-y-6">
                                            <div>
                                                <h3 className="text-[14px] font-medium text-white mb-3">
                                                    Connected Accounts
                                                </h3>
                                                <div className="space-y-3">
                                                    {Object.entries(user?.linkedAccounts || {}).map(
                                                        ([provider, connected]) =>
                                                            connected && (
                                                                <div
                                                                    key={provider}
                                                                    className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-lg border border-white/[0.08]"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-9 h-9 bg-white/[0.05] rounded-lg border border-white/[0.08] flex items-center justify-center shrink-0">
                                                                            {getProviderIcon(provider)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-white capitalize text-[13px] truncate">
                                                                                {provider === "credentials"
                                                                                    ? "Email & Password"
                                                                                    : provider}
                                                                            </p>
                                                                            <p className="text-[12px] text-zinc-500">
                                                                                Connected
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ),
                                                    )}
                                                </div>
                                            </div>

                                            {user?.hasPassword && (
                                                <div className="pt-6 border-t border-white/[0.08]">
                                                    <h3 className="text-[14px] font-medium text-white mb-3">
                                                        Password
                                                    </h3>
                                                    <button className="w-full sm:w-auto px-5 py-2.5 bg-white/[0.05] text-zinc-200 font-medium rounded-lg border border-white/[0.08] hover:bg-white/[0.08] transition-colors text-[13px]">
                                                        Change Password
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "activity" && user && (
                                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg">
                                        <div className="p-6 lg:p-8 border-b border-white/[0.08]">
                                            <h2 className="text-[18px] font-semibold text-white">
                                                Account Activity
                                            </h2>
                                            <p className="text-zinc-400 text-[13px] mt-1.5">
                                                View your account activity and important dates
                                            </p>
                                        </div>

                                        <div className="p-6 lg:p-8">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-5 bg-white/[0.03] rounded-lg border border-white/[0.08]">
                                                    <h3 className="text-[12px] font-medium text-zinc-400 mb-2">
                                                        Last Login
                                                    </h3>
                                                    <p className="text-[15px] font-medium text-white">
                                                        {user.lastLogin
                                                            ? formatDate(user.updatedAt)
                                                            : "Never"}
                                                    </p>
                                                </div>

                                                <div className="p-5 bg-white/[0.03] rounded-lg border border-white/[0.08]">
                                                    <h3 className="text-[12px] font-medium text-zinc-400 mb-2">
                                                        Account Created
                                                    </h3>
                                                    <p className="text-[15px] font-medium text-white">
                                                        {formatDate(user.createdAt)}
                                                    </p>
                                                </div>

                                                <div className="p-5 bg-white/[0.03] rounded-lg border border-white/[0.08]">
                                                    <h3 className="text-[12px] font-medium text-zinc-400 mb-2">
                                                        Email Status
                                                    </h3>
                                                    <p className="text-[15px] font-medium text-white">
                                                        {user.isEmailVerified ? "Verified" : "Not Verified"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showDeleteModal && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg max-w-md w-full p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-[16px] font-semibold text-white text-center mb-2">
                                    Delete Account
                                </h3>
                                <p className="text-zinc-400 text-[13px] text-center mb-5 leading-relaxed">
                                    This action cannot be undone. All your data will be
                                    permanently deleted.
                                </p>
                                {adminerror && (
                                    <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg py-2 text-[13px] text-center mb-5">
                                        {adminerror}
                                    </p>
                                )}

                                <div className="mb-6">
                                    <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                                        Type &quot;delete&quot; to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmInput}
                                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                        placeholder="Type 'delete' here"
                                        className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 text-white text-[14px] placeholder-zinc-600"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteConfirmInput("");
                                        }}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2.5 bg-white/[0.05] text-zinc-200 font-medium rounded-lg border border-white/[0.08] hover:bg-white/[0.08] transition-colors disabled:opacity-50 text-[13px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={
                                            isDeleting || deleteConfirmInput.toLowerCase() !== "delete"
                                        }
                                        className="flex-1 px-4 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[13px]"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Account"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );

}