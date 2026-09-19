import { Link } from "react-router-dom";
import { Landmark } from "lucide-react";
import LoginForm from "../../components/auth/LoginForm.jsx";
import AuthShowcasePanel from "../../components/auth/AuthShowcasePanel.jsx";
import ThemeToggle from "../../components/layout/ThemeToggle.jsx";
import Card from "../../components/ui/Card.jsx";

export default function LoginPage() {
  return (
    <div className="auth-page-gradient relative min-h-screen bg-bg">
      <div className="absolute right-4 top-4 sm:right-8 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center border-b border-border py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg text-white">
            <Landmark size={19} />
          </div>
          <span className="text-lg font-bold text-heading">Praxis</span>
        </Link>
      </div>

      <div className="flex flex-col items-center gap-12 px-6 pb-14 pt-8 lg:flex-row lg:items-start lg:justify-center lg:gap-16 lg:px-10 lg:pt-5 xl:gap-20">
        <AuthShowcasePanel
          eyebrow="Built for Chartered Accountants"
          title="Pick up right where your"
          highlight="practice left off."
          subtitle="Log in to manage compliance deadlines, clients and staff across your firm."
        />

        <Card className="w-full max-w-md shrink-0 rounded-3xl p-8 shadow-xl sm:p-10 lg:w-110">
          <h1 className="text-center text-[32px] font-bold text-heading">Welcome back</h1>
          <p className="mt-2 text-center text-base text-text-muted">Log in to your Praxis account.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-7 text-center text-sm text-text-muted">
            New to Praxis?{" "}
            <Link to="/signup" className="font-semibold text-brand hover:underline">
              Start your free trial
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
