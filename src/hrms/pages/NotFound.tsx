import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      // Redirect to user's dashboard based on role
      const roleRouteMap: { [key: string]: string } = {
        superadmin: "/superadmin",
        leadmentor: "/leadmentor", 
        schooladmin: "/admin",
        admin: "/admin",
        mentor: "/mentor",
        employee: "/mentor",
        student: "/student"
      };
      const route = roleRouteMap[user.role] || "/";
      navigate(route);
    } else {
      navigate("/");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="p-8 text-center">
          {/* 404 Number */}
          <div className="mb-6">
            <h1 className="text-8xl font-bold text-slate-200 mb-2">404</h1>
            <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-3">
              Page Not Found
            </h2>
            <p className="text-slate-600 leading-relaxed">
              The page you're looking for doesn't exist or has been moved to a different location.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleGoHome}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2.5"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Need help? Contact our support team or check our documentation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
