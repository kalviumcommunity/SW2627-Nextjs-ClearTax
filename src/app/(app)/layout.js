"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileSpreadsheet, History, Settings, User, FileText, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useState, useEffect, useRef } from "react";

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayName = mounted && user?.name ? user.name : "";
  const displayEmail = mounted && user?.email ? user.email : "";
  const profilePicture = mounted && user?.profilePicture ? user.profilePicture : null;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Invoices", href: "/upload", icon: FileSpreadsheet },
    { name: "Results", href: "/results", icon: FileText },
    { name: "Reports", href: "/reports", icon: History },
    { name: "Library", href: "/library", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50/20 flex font-sans text-stone-900">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-gray-100 bg-white z-10 h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="text-xl font-bold text-[#5a38ef] tracking-tight">ClearTax</div>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#f4f2ff] text-[#5a38ef] font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon size={18} className={`mr-3 ${isActive ? "text-[#5a38ef]" : "text-gray-400"}`} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[14px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-100">
          {mounted && user ? (
            <div className="flex items-center mb-4 px-2">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-150"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#f4f2ff] flex items-center justify-center text-[#5a38ef] font-medium text-sm">
                  {initial}
                </div>
              )}
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center mb-4 px-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-100" />
              <div className="ml-3 space-y-1.5 flex-1">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-2.5 bg-gray-100 rounded w-28" />
              </div>
            </div>
          )}
          <button
            onClick={() => {
              clearUser();
              router.push("/");
            }}
            className="flex items-center text-red-600 hover:text-red-700 transition-colors px-2 w-full"
          >
            <LogOut size={14} className="mr-2" />
            <span className="text-xs font-semibold">Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-100 px-10 flex justify-between items-center sticky top-0 bg-white z-20">
          <div className="text-sm font-semibold text-gray-800">
            {navigation.find(item => item.href === pathname)?.name || "Invoice Processing"}
          </div>

          {/* User Profile Header Dropdown */}
          {mounted && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-all outline-none"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#f4f2ff] flex items-center justify-center text-[#5a38ef] font-medium text-sm border border-gray-100">
                    {initial}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-gray-900 leading-none">{displayName}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 leading-none">{displayEmail}</p>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-gray-150 shadow-lg py-2 z-30 transition-all animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-50 sm:hidden">
                    <p className="text-xs font-bold text-gray-900">{displayName}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{displayEmail}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={14} className="mr-2 text-gray-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={14} className="mr-2 text-gray-400" />
                    <span>Account Settings</span>
                  </Link>
                  <hr className="my-1 border-gray-50" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      clearUser();
                      router.push("/");
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={14} className="mr-2" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-gray-50/10">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
