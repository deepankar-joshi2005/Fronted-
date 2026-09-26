/** @format */

import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionExpiration } from "@/hooks/useSubscriptionExpiration";

const SubscriptionOverlay: React.FC = () => {
  const { isExpired, expirationTitle, expirationDesc, isAdmin, isNeverSubscribed } = useSubscriptionExpiration();

  if (!isExpired) return null;

  return (
    <div className="absolute inset-0 z-[40] flex items-center justify-center p-8 md:p-12 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500 overflow-hidden">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 p-8 text-center space-y-6 transform scale-100 transition-all max-h-[90vh] overflow-y-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/30 rotate-3 animate-bounce-subtle">
          <AlertCircle className="w-10 h-10 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            {expirationTitle}
          </h2>
          <p className="text-slate-500 text-base leading-relaxed px-4">
            {expirationDesc}
          </p>
        </div>

        <div className="pt-2">
          {isAdmin ? (
            <Link to="/hrms/SuperAdmin/billing">
              <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-2xl shadow-xl shadow-blue-500/40 group active:scale-[0.98] transition-all">
                {isNeverSubscribed ? "Subscribe Now" : "Go to Billing & Upgrade"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          ) : (
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-blue-700 font-bold text-base">
                Please contact your Administrator or System Owner to renew the subscription.
              </p>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-400 font-medium tracking-wide uppercase">
            Questions? <span className="text-blue-500 cursor-pointer hover:underline font-bold">Contact Support</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionOverlay;
