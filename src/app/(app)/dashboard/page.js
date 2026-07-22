"use client";

import { FileSpreadsheet, CheckCircle, AlertCircle, Clock, User, Mail, Shield, ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import Button from "@/components/ui/Button";

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, matches: 0, mismatches: 0, pending: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentBatches, setRecentBatches] = useState([]);
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/auth/me");
        if (response.data.success) {
          setProfile(response.data.user);
        }
      } catch {
        clearUser();
        toast.error("Session expired", {
          description: "Please sign in again.",
        });
        router.push("/login");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [clearUser, router]);

  useEffect(() => {
    let activeIntervalId = null;

    const fetchDashboardData = async () => {
      try {
        // Fetch 5 most recent batches
        const uploadsResponse = await axios.get("/uploads?page=1&limit=5");
        if (uploadsResponse.data.success) {
          const uploads = uploadsResponse.data.data;
          setRecentBatches(uploads);

          // Calculate counts based on ALL historical invoices
          const allRes = await axios.get("/upload");
          if (allRes.data.success) {
            const allUploads = allRes.data.data;
            let total = 0;
            let matches = 0;
            let mismatches = 0;
            let pending = 0;

            allUploads.forEach(batch => {
              if (batch.invoices) {
                batch.invoices.forEach(inv => {
                  total++;
                  if (inv.status === "MATCHED") matches++;
                  else if (inv.status === "MISMATCHED") mismatches++;
                  else if (inv.status === "PENDING" || inv.status === "PROCESSING") pending++;
                });
              }
            });

            setStats({ total, matches, mismatches, pending });
          }

          // Set up polling if there's any active background worker job running
          const hasActiveJob = uploads.some(batch => 
            batch.status === "PENDING" || batch.status === "PROCESSING"
          );

          if (hasActiveJob && !activeIntervalId) {
            activeIntervalId = setInterval(fetchDashboardData, 2000);
          } else if (!hasActiveJob && activeIntervalId) {
            clearInterval(activeIntervalId);
            activeIntervalId = null;
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      if (activeIntervalId) {
        clearInterval(activeIntervalId);
      }
    };
  }, []);

  const containerVariants = {
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-8 animate-fadeIn"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}. Here is what&apos;s happening with your invoices today.
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Your Profile</h2>
        {profileLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-64" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <User size={18} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Name</p>
                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Mail size={18} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className="text-sm font-semibold text-gray-900">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Shield size={18} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Role</p>
                <p className="text-sm font-semibold text-gray-900">{profile.role}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Could not load profile.</p>
        )}
      </motion.div>

      {/* Stats Counter Section */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {[
          { name: "Total Invoices", value: statsLoading ? "..." : stats.total, icon: FileSpreadsheet, accent: "bg-blue-400" },
          { name: "Matches", value: statsLoading ? "..." : stats.matches, icon: CheckCircle, accent: "bg-emerald-400" },
          { name: "Mismatches", value: statsLoading ? "..." : stats.mismatches, icon: AlertCircle, accent: "bg-rose-400" },
          { name: "Pending / Processing", value: statsLoading ? "..." : stats.pending, icon: Clock, accent: "bg-indigo-400" },
        ].map((stat) => (
          <motion.div
            key={stat.name}
            variants={itemVariants}
            className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden hover:shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <div className={`absolute top-4 right-4 w-6 h-6 rounded-lg opacity-80 ${stat.accent}`} />
            <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-2">{stat.name}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Uploads Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Recent Uploads</h2>
          <Link href="/library" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View All Uploads
          </Link>
        </div>

        {statsLoading && recentBatches.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex justify-center items-center shadow-sm">
            <Loader2 className="animate-spin text-indigo-500 mr-2" size={20} />
            <p className="text-sm text-gray-500">Loading recent uploads...</p>
          </div>
        ) : recentBatches.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-sm shadow-sm">
            No uploads found. Go to the upload page to upload your invoice CSVs.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recentBatches.map((batch) => {
              const percentage = batch.totalRows > 0
                ? Math.round((batch.processedRows / batch.totalRows) * 100)
                : 0;

              return (
                <div
                  key={batch.id}
                  onClick={() => router.push(`/results?jobId=${batch.id}`)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{batch.originalFileName}</h3>
                      <p className="text-xs text-gray-400">
                        Batch #{batch.id} • {new Date(batch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs px-2">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-gray-400 font-medium">Processing Progress</span>
                      <span className="text-gray-700 font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          batch.status === "FAILED"
                            ? "bg-rose-500"
                            : batch.status === "COMPLETED"
                            ? "bg-emerald-500"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400">
                      <span>{batch.processedRows} of {batch.totalRows} rows</span>
                      <span className="capitalize">{batch.status.toLowerCase()}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">Success / Failed</p>
                      <p className="text-sm font-bold text-gray-900">
                        <span className="text-emerald-600">{batch.successfulRows}</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className="text-rose-600">{batch.failedRows}</span>
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Main Actions section */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-gray-200 rounded-2xl p-8 text-center min-h-[260px] flex flex-col justify-center items-center shadow-sm"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 mb-4 animate-bounce">
          <FileSpreadsheet size={32} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Upload New Invoices</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          Start processing a new batch of invoices. We support processing multiple CSV files at once.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link href="/upload">
            <Button icon={ArrowRight}>Go to Upload</Button>
          </Link>
          <Link href="/library">
            <Button variant="secondary">View old records</Button>
          </Link>
          <Link href="/reports">
            <Button variant="secondary">Analytics &amp; Reports</Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
