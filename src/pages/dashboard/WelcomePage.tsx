import { useEffect, useState } from "react";
import { Landmark, ExternalLink } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { ROLE_LABELS } from "../../config/roles.js";
import * as businessClientApi from "../../api/businessClient.api.js";
import { BUSINESS_CLIENT_ROLES, redirectToHrms } from "../../utils/hrmsSso.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

function BusinessClientWelcome({ user }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function openHrms() {
    setFailed(false);
    setRedirecting(true);
    const ok = await redirectToHrms();
    if (!ok) {
      setRedirecting(false);
      setFailed(true);
    }
  }

  useEffect(() => {
    businessClientApi
      .getMyBusinessClient()
      .then(({ data }) => {
        const businessClient = data.data;
        setClient(businessClient);
        // No manual "Open HRMS" click needed — this page only ever shows up
        // as a fallback (login-time SSO redirect skipped/failed, back button,
        // stale tab), so auto-redirect straight away instead of making the
        // user click through a middle screen.
        if (businessClient?.hrmsCompanyId) openHrms();
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || redirecting) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-24 text-center">
        <Spinner size={24} />
        <p className="text-sm text-text-muted">Taking you to your HRMS…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Landmark size={26} />
      </span>
      <h1 className="text-2xl font-bold text-heading">Welcome, {user?.name?.split(" ")[0]}</h1>
      <p className="text-sm text-text-muted">
        You're signed in as {ROLE_LABELS[user?.role]}
        {client?.name && (
          <>
            {" "}
            for <strong className="text-text">{client.name}</strong>
          </>
        )}
        . Your day-to-day work — employees, attendance, leave, payroll — happens in your HRMS.
      </p>

      {client?.hrmsCompanyId ? (
        <Card className="mt-2 flex w-full flex-col items-center gap-4 p-6">
          {failed && <p className="text-sm text-danger">Couldn't reach your HRMS. Try again.</p>}
          <Button onClick={openHrms}>
            <ExternalLink size={16} /> Open HRMS
          </Button>
        </Card>
      ) : (
        <Card className="mt-2 w-full p-5 text-sm text-text-muted">
          Your HRMS access is still being set up. Contact your CA firm if this doesn't resolve shortly.
        </Card>
      )}

      <Card className="w-full p-5 text-left">
        <p className="text-sm font-semibold text-heading">Account</p>
        <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
      </Card>
    </div>
  );
}

export default function WelcomePage() {
  const { user } = useAuth();

  if (BUSINESS_CLIENT_ROLES.includes(user?.role)) {
    return <BusinessClientWelcome user={user} />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Landmark size={26} />
      </span>
      <h1 className="text-2xl font-bold text-heading">Welcome to Praxis, {user?.name?.split(" ")[0]}</h1>
      <p className="text-sm text-text-muted">
        You're signed in as {ROLE_LABELS[user?.role]}. Your modules are being built and will appear in the sidebar
        as they ship.
      </p>
      <Card className="mt-2 w-full p-5 text-left">
        <p className="text-sm font-semibold text-heading">Account</p>
        <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
      </Card>
    </div>
  );
}
