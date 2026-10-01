import { useEffect, useState } from "react";
import { Users as UsersIcon } from "lucide-react";
import * as userApi from "../../api/user.api.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";
import { ROLE_LABELS } from "../../config/roles.js";

const PAGE_SIZE = 15;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [role, setRole] = useState("");
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${role}|${debouncedSearch}|${dateRange.startDate}|${dateRange.endDate}`);

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (role) params.role = role;
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const { data } = await userApi.listUsers(params);
      setUsers(data.data);
      setMeta(data.meta || { total: data.data.length, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role, debouncedSearch, dateRange.startDate, dateRange.endDate]);

  async function handleToggle(user) {
    await userApi.toggleUserActive(user.id);
    load();
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-heading">{row.name}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    { key: "role", label: "Role", render: (row) => <Badge variant="brand">{ROLE_LABELS[row.role]}</Badge> },
    { key: "firm", label: "CA Firm", render: (row) => row.caFirmId?.name || "—" },
    {
      key: "isActive",
      label: "Status",
      render: (row) => <Badge variant={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Disabled"}</Badge>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleToggle(row)}>
          {row.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Users</h1>
        <p className="mt-1 text-sm text-text-muted">Every account across every CA firm on the platform.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="w-full max-w-sm">
          <Input label="Search" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-56">
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="ca_firm_admin">CA Firm Admin</option>
            <option value="ca_firm_staff">CA Firm Staff</option>
            <option value="business_client_admin">Business Client Admin</option>
            <option value="business_client_employee">Employee</option>
          </Select>
        </div>
        <DateRangeFilter
          preset={dateRange.preset}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Try a different search or filter." />
      ) : (
        <Table
          columns={columns}
          data={users}
          keyField="id"
          pagination={{ page, totalPages: meta.totalPages, total: meta.total, limit: PAGE_SIZE, onChange: setPage }}
        />
      )}
    </div>
  );
}
