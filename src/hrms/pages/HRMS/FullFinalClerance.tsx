/** @format */
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export interface Clearance {
  _id: string;
  employee: {
    _id: string;
    name: string;
  };
  clearances: {
    department: string;
    status: "PENDING" | "APPROVED";
  }[];
}

export default function FullFinalClearance() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1️⃣ Clearance list
      const clearanceRes = await axios.get(`${API}/clearances`, {
        headers,
        params: { limit: 1000 },
      });
      const clearanceList = clearanceRes.data.data || [];

      const results = [];

      for (const c of clearanceList) {
        const employeeId = c.employee._id;

        // 2️⃣ Assets
        const assetsRes = await axios.get(`${API}/non-it-assets`, { headers });

        const hasAssets = assetsRes.data.some((a: any) =>
          a.assignedTo?.some((x: any) => x.user?._id === employeeId)
        );

        // 3️⃣ Workstation
        const wsRes = await axios.get(`${API}/workstations`, { headers });

        const hasDesk = wsRes.data.some(
          (w: any) => w.employee?._id === employeeId && w.status === "ALLOCATED"
        );

        // 4️⃣ Access Card
        const cardRes = await axios.get(`${API}/access-cards`, { headers });

        const hasCard = cardRes.data.some(
          (c: any) => c.employee?._id === employeeId && c.status === "ASSIGNED"
        );

        // 5️⃣ Admin clearance
        const adminClearance = c.clearances.find(
          (x: any) => x.department === "Admin"
        );

        const adminCleared = adminClearance?.status === "CLEARED";


        results.push({
          clearanceId: c._id,
          employee: c.employee.name,
          assets: !hasAssets,
          workstation: !hasDesk,
          accessCard: !hasCard,
          admin: adminCleared,
        });

      }

      setData(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalChange = async (clearanceId: string, value: string) => {
    try {
      await axios.patch(
        `${API}/clearances/${clearanceId}/department`,
        {
          departmentName: "Admin",
          status: value === "CLEARED" ? "CLEARED" : "PENDING",
        },
        { headers }
      );

      fetchData(); // refresh table
    } catch (err) {
      console.error(err);
      alert("Failed to update clearance");
    }
  };


  const badge = (ok: boolean) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {ok ? "CLEARED" : "PENDING"}
    </span>
  );

  if (loading) return <p>Loading clearance...</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-6">Full & Final Clearance</h2>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Employee</th>
            <th className="p-3">Assets</th>
            <th className="p-3">Workstation</th>
            <th className="p-3">Access Card</th>
            <th className="p-3">Final</th>
          </tr>
        </thead>

        <tbody>
          {data.map((r, i) => { // admin clearance hi final decide karega
            return (
              <tr key={i} className="border-t text-center">
                <td className="p-3 text-left font-medium">{r.employee}</td>
                <td className="p-3">{badge(r.assets)}</td>
                <td className="p-3">{badge(r.workstation)}</td>
                <td className="p-3">{badge(r.accessCard)}</td>
                <td className="p-3">
                  {r.admin ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                      CLEARED
                    </span>
                  ) : (
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      defaultValue="IN_PROGRESS"
                      onChange={(e) =>
                        handleFinalChange(r.clearanceId, e.target.value)
                      }
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="CLEARED">Cleared</option>
                    </select>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
