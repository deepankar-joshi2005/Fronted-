/** @format */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const useSubscriptionExpiration = () => {
    const { user, refreshUser } = useAuth();
    const location = useLocation();

    const checkExpiration = () => {
        if (!user || user.isSystemAdmin) return false;

        const now = new Date();

        // 1. Plan explicitly marked as EXPIRED
        const plan = (user.subscriptionPlan || '').toUpperCase();
        if (plan === 'EXPIRED') return true;

        // Fallback date check (Handles TRIAL/TRAIL typo and case sensitivity)
        if ((plan === 'TRIAL' || plan === 'TRAIL') && user.trialEndDate) {
            // Use end of day for the comparison to be fair
            const expiry = new Date(user.trialEndDate);
            expiry.setHours(23, 59, 59, 999);
            if (now > expiry) return true;
        }

        if (plan === 'ACTIVE' && user.subscriptionEndDate) {
            const expiry = new Date(user.subscriptionEndDate);
            expiry.setHours(23, 59, 59, 999);
            if (now > expiry) return true;
        }

        return false;
    };

    const [isExpiredLocal, setIsExpiredLocal] = useState(checkExpiration());

    useEffect(() => {
        // Initial sync
        refreshUser();

        const handleExpired = () => setIsExpiredLocal(true);
        window.addEventListener("subscription_expired", handleExpired);
        return () => window.removeEventListener("subscription_expired", handleExpired);
    }, []);

    // Sync with auth user state
    useEffect(() => {
        setIsExpiredLocal(checkExpiration());
    }, [user]);

    const isBillingPage = location.pathname.includes("/billing");
    const isTrial = user?.subscriptionPlan === 'TRIAL';
    const expirationTitle = isTrial ? "Free Trial Ended" : "Subscription Ended";
    const expirationDesc = isTrial
        ? "Your 15-day free trial has come to an end. Subscribe now to keep managing your workforce without any interruptions."
        : "Your subscription has expired. Please renew your plan to restore access to all HRMS features and data.";

    return {
        isExpired: isExpiredLocal && !isBillingPage,
        expirationTitle,
        expirationDesc,
        isAdmin: user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('superadmin'),
    };
};
