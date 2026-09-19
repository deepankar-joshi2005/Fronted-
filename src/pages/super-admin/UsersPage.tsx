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
import { ROLE_LABELS } from "../../config/roles.js";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (role) params.role = role;
      const { data } = await userApi.listUsers(params);
      setUsers(data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

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

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="max-w-sm flex-1"
        >
          <Input placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <div className="w-full sm:w-56">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="ca_firm_admin">CA Firm Admin</option>
            <option value="ca_firm_staff">CA Firm Staff</option>
            <option value="business_client_admin">Business Client Admin</option>
            <option value="business_client_employee">Employee</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Try a different search or filter." />
      ) : (
        <Table columns={columns} data={users} keyField="id" />
      )}
    </div>
  );
}
