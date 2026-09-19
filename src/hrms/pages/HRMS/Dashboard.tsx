/** @format */
import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Laptop, IdCard, Armchair, Car, Boxes, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: any;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm border p-5 flex items-center gap-4 hover:shadow-md transition">
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    workstations: 0,
    wsAllocated: 0,
    wsReleased: 0,

    idActive: 0,
    idReturned: 0,

    lockersAllocated: 0,
    parkingAllocated: 0,

    nonItTotal: 0,
    nonItAssigned: 0,
    nonItAvailable: 0,
    nonItDamaged: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          workstationsRes,
          idCardsRes,
          lockersRes,
          parkingRes,
          nonItAssetsRes,
        ] = await Promise.all([
          axiosInstance.get("/workstations"),
          axiosInstance.get("/access-cards"),
          axiosInstance.get("/locker-assignments"),
          axiosInstance.get("/parking-assignments"),
          axiosInstance.get("/non-it-assets"),
        ]);

        // 🪑 Workstations
        const ws = workstationsRes.data;
        const wsAllocated = ws.filter(
          (w: any) => w.status === "ALLOCATED"
        ).length;
        const wsReleased = ws.filter(
          (w: any) => w.status === "RELEASED"
        ).length;

        // 🪪 ID Cards
        const idCards = idCardsRes.data;
        const idActive = idCards.filter(
          (i: any) => i.status === "ACTIVE"
        ).length;
        const idReturned = idCards.filter(
          (i: any) => i.status === "RETURNED"
        ).length;

        // 🔐 Lockers
        const lockers = lockersRes.data;
        const lockersAllocated = lockers.filter(
          (l: any) => l.status === "ALLOCATED"
        ).length;

        // 🚗 Parking
        const parking = parkingRes.data;
        const parkingAllocated = parking.filter(
          (p: any) => p.status === "ALLOCATED"
        ).length;

        // 📦 Non-IT Assets
        const nonIt = nonItAssetsRes.data;
        const nonItTotal = nonIt.length;
        const nonItAssigned = nonIt.filter(
          (a: any) => a.status === "ASSIGNED"
        ).length;
        const nonItAvailable = nonIt.filter(
          (a: any) => a.status === "AVAILABLE"
        ).length;
        const nonItDamaged = nonIt.reduce(
          (sum: number, a: any) => sum + (a.damagedCount || 0),
          0
        );

        setStats({
          workstations: ws.length,
          wsAllocated,
          wsReleased,

          idActive,
          idReturned,

          lockersAllocated,
          parkingAllocated,

          nonItTotal,
          nonItAssigned,
          nonItAvailable,
          nonItDamaged,
        });
      } catch (err) {
        console.error("Dashboard API error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== PAGE TITLE ===== */}
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Facility, onboarding & asset overview
        </p>
      </div>

      {/* ===== STATS GRID ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Workstations"
          value={stats.workstations}
          icon={Laptop}
          color="bg-blue-600"
        />
        <StatCard
          title="Workstations Allocated"
          value={stats.wsAllocated}
          icon={Laptop}
          color="bg-green-600"
        />
        <StatCard
          title="Workstations Released"
          value={stats.wsReleased}
          icon={Laptop}
          color="bg-gray-600"
        />

        <StatCard
          title="Active ID Cards"
          value={stats.idActive}
          icon={IdCard}
          color="bg-indigo-600"
        />
        <StatCard
          title="Returned ID Cards"
          value={stats.idReturned}
          icon={IdCard}
          color="bg-orange-600"
        />

        <StatCard
          title="Lockers Allocated"
          value={stats.lockersAllocated}
          icon={Armchair}
          color="bg-purple-600"
        />

        <StatCard
          title="Parking Allocated"
          value={stats.parkingAllocated}
          icon={Car}
          color="bg-pink-600"
        />

        <StatCard
          title="Non-IT Assets"
          value={stats.nonItTotal}
          icon={Boxes}
          color="bg-cyan-600"
        />
      </div>

      {/* ===== NON-IT ASSET SUMMARY ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Assets"
          value={stats.nonItAssigned}
          icon={Boxes}
          color="bg-green-500"
        />
        <StatCard
          title="Available Assets"
          value={stats.nonItAvailable}
          icon={Boxes}
          color="bg-blue-500"
        />
        <StatCard
          title="Damaged Assets"
          value={stats.nonItDamaged}
          icon={Boxes}
          color="bg-red-500"
        />
      </div>

      {/* ===== QUICK LINKS ===== */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Allocate Workstation",
              to: "/hrms/admin/onboarding/workstation",
            },
            {
              label: "Issue ID Card",
              to: "/hrms/admin/onboarding/id-card",
            },
            {
              label: "Assign Locker",
              to: "/hrms/admin/onboarding/locker",
            },
            {
              label: "Assign Parking",
              to: "/hrms/admin/onboarding/transport",
            },
            {
              label: "Manage Non-IT Assets",
              to: "/hrms/admin/assets/non-it",
            },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition"
            >
              <span className="font-medium">{link.label}</span>
              <ArrowRight className="text-gray-400" size={18} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
