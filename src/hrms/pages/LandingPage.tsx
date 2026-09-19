/** @format */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  Briefcase,
  HardDrive,
  IndianRupee,
  Search,
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
  Clock,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  Star,
  Phone,
  Mail,
  MapPin,
  Globe,
  MessageCircle,
  Share2,
  Link2,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "/showcase_1.png",
      title: "Seamless Mobile Experience",
      subtitle: "Employee Self-Service",
      description: "Empower your workforce with a mobile-first portal for attendance, leaves, and real-time updates."
    },
    {
      image: "/showcase_2.png",
      title: "Precision Payroll Automation",
      subtitle: "Finance Intelligence",
      description: "Automate complex payroll cycles, statutory compliance, and salary disbursements with 100% accuracy."
    },
    {
      image: "/showcase_3.png",
      title: "Strategic Team Oversight",
      subtitle: "Manager Command Center",
      description: "Track performance metrics, manage approvals, and lead your team with data-driven insights."
    }
  ];

  const roles = [
    {
      title: "Super Admin",
      description: "Command center for your entire organization. Manage multiple branches, departments, and global policies with ease.",
      icon: ShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-50/50",
      features: ["Company Configuration", "Billing & Subscriptions", "Global Policy Control"]
    },
    {
      title: "People Manager",
      description: "Empower your leadership. Track team performance, approve leaves in one click, and monitor real-time attendance.",
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50/50",
      features: ["Team Performance Metrics", "Simplified Approvals", "Attendance Insights"]
    },
    {
      title: "Employee Portal",
      description: "Mobile-first experience for your workforce. Mark attendance, view payslips, and apply for leaves from anywhere.",
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
      features: ["Self-Service Dashboard", "Digital Payslips", "Leave & Expense Tracking"]
    },
    {
      title: "IT Administrator",
      description: "Secure your digital assets. Track hardware, manage software licenses, and automate onboarding workflows.",
      icon: HardDrive,
      color: "text-cyan-600",
      bg: "bg-cyan-50/50",
      features: ["Asset Inventory Management", "License Lifecycle", "Automated Offboarding"]
    },
    {
      title: "Finance & Payroll",
      description: "Accuracy in every rupee. Run complex payrolls, manage statutory reports, and disburse salaries instantly.",
      icon: IndianRupee,
      color: "text-amber-600",
      bg: "bg-amber-50/50",
      features: ["Automated Payroll Run", "Expense Reconciliation", "Statutory Compliance"]
    },
    {
      title: "System Auditor",
      description: "Maintain peak integrity. Access comprehensive audit logs and compliance reports for ultimate transparency.",
      icon: Search,
      color: "text-slate-600",
      bg: "bg-slate-50/50",
      features: ["Detailed Audit Logs", "Compliance Monitoring", "Data Integrity Reports"]
    }
  ];

  const mainFeatures = [
    { icon: LayoutDashboard, label: "Smart Dashboard" },
    { icon: Clock, label: "Real-time Attendance" },
    { icon: Shield, label: "Enterprise Security" },
    { icon: Zap, label: "Instant Automation" }
  ];

  // Auto-scroll logic for carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="force-light-theme min-h-screen bg-white selection:bg-blue-100 flex flex-col overflow-x-hidden">
      {/* 🧭 Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center p-1 shadow-lg shadow-blue-500/10">
              <img src="/hrms-logo.svg" alt="HRMS" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight"><span className="text-blue-600">HRMS</span></span>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <a href="#features" className="hover:text-blue-600 transition-colors">Platform</a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">Access Roles</a>
            <a href="#showcase" className="hover:text-blue-600 transition-colors">Showcase</a>
            <a href="#trial" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:block text-xs font-black text-slate-600 hover:text-blue-600 px-4 py-2 uppercase tracking-widest"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 uppercase tracking-widest"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section with High-Tech BG */}
      <section className="relative min-h-screen flex items-center bg-slate-950 overflow-hidden">
        {/* Generated Tech Background */}
        <div className="absolute inset-0 z-0">
          <img src="/hrms_hero_bg.png" alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950/20" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                <Star size={14} className="fill-blue-400" />
                India's Most Advanced AI-HRMS
              </div>

              <h1 
                className="text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter drop-shadow-[0_15px_40px_rgba(0,0,0,1)]"
                style={{ color: 'white' }}
              >
                Manage Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Human Capital</span> <br />
                with Precision.
              </h1>

              <p 
                className="text-xl text-white font-bold leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow-[0_10px_20px_rgba(0,0,0,1)]"
                style={{ color: '#F1F5F9' }}
              >
                Bridge the gap between technology and talent. Our ecosystem provides real-time visibility, automated accuracy, and unmatched employee experiences.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                <button
                  onClick={() => navigate("/register")}
                  className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-5 rounded-2xl transition-all shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 flex items-center justify-center gap-4 text-sm"
                  style={{ letterSpacing: '0.05em' }}
                >
                  START 15-DAY TRIAL
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <CheckCircle2 size={18} className="text-blue-500" />
                  No Card Required
                </div>
              </div>

              {/* Clients / Trust Bar */}
              <div className="pt-10 space-y-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Integrates With Your Ecosystem</p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e9/Google_Pay_Logo_%282020%29.svg" alt="GPay" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Amazon_Logo.svg" alt="Amazon" className="h-4" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="h-5" />
                </div>
              </div>
            </div>

            {/* Floating UI Elements / Abstract Visual */}
            <div className="hidden lg:block relative">
              <div className="relative z-10 p-4 rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-2xl shadow-[0_40px_100px_-20px_rgba(37,99,235,0.4)] rotate-3 hover:rotate-0 transition-transform duration-700">
                <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden p-2">
                  <img src="/showcase_1.png" alt="Showcase" className="w-full h-auto rounded-[2rem]" />
                </div>
                {/* Floating cards */}
                <div className="absolute -top-10 -right-10 p-6 rounded-2xl bg-white shadow-2xl animate-bounce" style={{ animationDuration: '4s' }}>
                  <Users className="text-blue-600 mb-2" size={24} />
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Active Employees</p>
                  <p className="text-2xl font-black text-slate-900">12,482</p>
                </div>
                <div className="absolute -bottom-6 -left-10 p-6 rounded-2xl bg-indigo-600 shadow-2xl animate-pulse">
                  <IndianRupee className="text-white mb-2" size={24} />
                  <p className="text-[10px] font-black text-white/70 uppercase tracking-tighter">Payroll Savings</p>
                  <p className="text-2xl font-black text-white">₹4.2 Cr</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 Quick Features Bar */}
      <section id="features" className="bg-slate-50 border-y border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-16">
            {mainFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 transform group-hover:-translate-y-1">
                  <f.icon size={22} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-[10px] text-slate-900 uppercase tracking-widest">{f.label}</span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Enterprise Grade</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🖼️ Auto-Showcase Carousel */}
      <section id="showcase" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Platform Showcase</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Experience Global <span className="text-blue-600">Standard</span> HR Tech</h3>
          </div>

          <div className="relative rounded-[3.5rem] bg-slate-950 p-4 lg:p-10 overflow-hidden shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
            <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay pointer-events-none" />

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-black">
                {/* Images with transition */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {slides.map((slide, i) => (
                    <div
                      key={i}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-1000 ease-in-out bg-slate-900",
                        currentSlide === i ? "opacity-100 z-10" : "opacity-0 z-0"
                      )}
                    >
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover scale-105" />
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                  <button onClick={prevSlide} className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/10 transition-all active:scale-95">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextSlide} className="p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-all active:scale-95">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-10 py-10">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {slides.map((_, i) => (
                      < div
                        key={i}
                        className={cn(
                          "h-1 rounded-full transition-all duration-500",
                          currentSlide === i ? "w-12 bg-blue-500" : "w-4 bg-slate-800"
                        )}
                      />
                    ))}
                  </div>
                  <span className="inline-block text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] py-1 border-b border-blue-500/30 drop-shadow-sm">
                    {slides[currentSlide].subtitle}
                  </span>
                  <h4 
                    className="text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-[0_10px_25px_rgba(0,0,0,1)]"
                    style={{ color: 'white' }}
                  >
                    {slides[currentSlide].title}
                  </h4>
                  <p className="text-lg text-slate-100 font-bold leading-relaxed drop-shadow-lg">
                    {slides[currentSlide].description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="space-y-2">
                    <p className="text-3xl font-black text-white">99.9%</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uptime Precision</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-black text-white">40%+</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Efficiency</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/register")}
                  className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-widest hover:text-blue-300 transition-colors group"
                >
                  Dive deeper into platform
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 👤 Roles - Improved Glassmorphism */}
      <section id="roles" className="py-32 bg-slate-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Access Ecosystem</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Permissions Built for <span className="text-blue-600">Enterprise</span>.</h3>
            <p className="text-slate-500 font-bold max-w-2xl mx-auto">One platform, six perspectives. Every team member sees exactly what they need for maximum efficiency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roles.map((role, i) => (
              <div key={i} className="group relative p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white hover:bg-white hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700" />

                <div className="relative z-10">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500", role.bg, role.color)}>
                    <role.icon size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4">{role.title}</h4>
                  <p className="text-[13px] font-bold text-slate-500 leading-relaxed mb-8 opacity-80 group-hover:opacity-100 transition-opacity">{role.description}</p>

                  <div className="space-y-3 pt-6 border-t border-slate-100">
                    {role.features.map((feat, fi) => (
                      <div key={fi} className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-tight group-hover:text-slate-700 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🎁 15-Day Trial Section - High Fidelity Glass */}
      <section id="trial" className="py-20 px-4 md:px-0 bg-white">
        <div className="max-w-6xl mx-auto rounded-[4rem] relative overflow-hidden bg-slate-950 p-12 lg:p-24 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)]">
          {/* Background visuals inside card */}
          <div className="absolute inset-0 z-0">
            <img src="/hrms_hero_bg.png" alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply transition-colors group-hover:bg-blue-800/40" />
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.3em]">Scalable ROI</div>
              <h3 
                className="text-5xl lg:text-7xl font-black text-white leading-[0.95] tracking-tighter drop-shadow-[0_15px_40px_rgba(0,0,0,1)]"
                style={{ color: 'white' }}
              >
                Ready to Scale <br /> Your Team?
              </h3>
              <p className="text-blue-100/70 font-bold text-xl leading-relaxed">Join 500+ forward-thinking organizations using HRMS to automate excellence. No commitment, just results.</p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><CheckCircle2 size={20} /></div>
                  <p className="text-xs font-bold text-white tracking-wide uppercase">No Credit Card</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><CheckCircle2 size={20} /></div>
                  <p className="text-xs font-bold text-white tracking-wide uppercase">Instant Access</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="p-1 rounded-[3rem] bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden group">
                <div className="bg-slate-900/80 p-10 rounded-[2.8rem] space-y-10 text-center">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">Enterprise Free Trial</h4>
                    <div className="flex items-baseline justify-center gap-1 text-white">
                      <span className="text-7xl font-black tracking-tighter">₹0</span>
                      <span className="text-slate-500 font-bold text-xl">/15D</span>
                    </div>
                  </div>

                  <ul className="space-y-4 text-left max-w-[200px] mx-auto">
                    {["6 Admin Roles", "99.9% Uptime", "AI-Powered BI", "Cloud Security"].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate("/register")}
                    className="w-full bg-white hover:bg-blue-50 text-slate-900 font-black py-5 rounded-2xl shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest"
                  >
                    START YOUR TRIAL NOW
                  </button>

                  <p className="text-[9px] font-bold text-slate-500 tracking-tighter uppercase italic">Includes premium support and dedicated account manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔚 Footer - Premium Dark */}
      <footer className="bg-slate-950 border-t border-white/5 pt-24 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            {/* Column 1: Brand & Contact */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1 shadow-2xl">
                  <img src="/hrms-logo.svg" alt="HRMS" className="w-full h-full object-contain rounded-lg" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight uppercase" style={{ color: 'white' }}>HRMS</span>
              </div>
              
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Building technology solutions for a better tomorrow
              </p>

              <div className="space-y-4">
                <a href="tel:+918758058916" className="flex items-center gap-4 text-slate-400 hover:text-blue-500 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm font-bold tracking-wide">+918758058916</span>
                </a>
                <a href="mailto:contact@techizebuilder.com" className="flex items-center gap-4 text-slate-400 hover:text-blue-500 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Mail size={16} />
                  </div>
                  <span className="text-sm font-bold tracking-wide">contact@techizebuilder.com</span>
                </a>
                <div className="flex items-start gap-4 text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-500 mt-1 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <span className="text-sm font-medium leading-relaxed">
                    149, Khandsa Marg, BALA JI MANDIR,<br />
                    Khandsa Village, Gurugram, Gurugram,<br />
                    Haryana, 122004
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-8 lg:pl-10">
              <h5 className="text-[11px] font-black text-white uppercase tracking-[0.3em] border-b border-blue-500/30 pb-4 inline-block" style={{ color: 'white' }}>Quick Links</h5>
              <ul className="space-y-4">
                {["Services", "Technologies", "Portfolio", "Contact", "Admin"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-blue-500 text-sm font-bold uppercase tracking-widest transition-colors block leading-none">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Our Services */}
            <div className="space-y-8">
              <h5 className="text-[11px] font-black text-white uppercase tracking-[0.3em] border-b border-blue-500/30 pb-4 inline-block" style={{ color: 'white' }}>Our Services</h5>
              <ul className="space-y-4">
                {[
                  "Web Development",
                  "Mobile App Development",
                  "E-commerce Solutions",
                  "Custom Software",
                  "Maintenance & Support"
                ].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-blue-500 text-sm font-bold tracking-wide transition-colors block leading-none">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Connectivity & Hours */}
            <div className="space-y-10 text-center lg:text-left">
              <div className="space-y-6">
                <h5 className="text-[11px] font-black text-white uppercase tracking-[0.3em] border-b border-blue-500/30 pb-4 inline-block" style={{ color: 'white' }}>Stay Connected</h5>
                <div className="flex items-center justify-center lg:justify-start gap-4">
                  {[Globe, MessageCircle, Share2, Link2, Send].map((Icon, idx) => (
                    <a key={idx} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all transform hover:-translate-y-1">
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
                <h6 className="text-[10px] font-black text-white uppercase tracking-widest" style={{ color: 'white' }}>Business Hours</h6>
                <ul className="space-y-2 text-xs font-bold text-slate-400">
                  <li className="flex justify-between"><span>Mon - Fri:</span> <span>9:00 AM - 6:00 PM</span></li>
                  <li className="flex justify-between"><span>Sat:</span> <span>10:00 AM - 4:00 PM</span></li>
                  <li className="flex justify-between text-slate-600 italic"><span>Sun:</span> <span>Closed</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              © 2026 <span className="text-white" style={{ color: 'white' }}>HRMS</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
