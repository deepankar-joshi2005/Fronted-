import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users,
  Contact2,
  ClipboardCheck,
  PiggyBank,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Laptop,
  Briefcase,
  FileCheck,
  Coins,
  CalendarCheck,
  TrendingUp,
  Download,
  Building2,
  FileText,
  Clock,
  Check,
  BarChart3,
  Sliders,
  DollarSign,
  UserPlus,
  MessageSquare,
  Layers,
} from "lucide-react";

interface RoleDetail {
  name: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  icon: any;
  summary: string;
  responsibilities: string[];
  keyFeatures: string[];
}

interface StatItem {
  label: string;
  value: string;
  icon: any;
  cardStyle: string;
  iconStyle: string;
  valueStyle: string;
}

interface ModuleData {
  id: string;
  shortName: string;
  category: string;
  badgePill: string;
  gradientText: string;
  headline: {
    line1: string;
    line2: string;
  };
  tagline: string;
  icon: any;
  headerAccent: string;
  overview: string;
  stats: StatItem[];
  roles?: RoleDetail[];
  capabilities: {
    title: string;
    description: string;
    icon: any;
    highlights: string[];
  }[];
  benefits: {
    forFirms: string[];
    forClients: string[];
  };
}

const MODULES_DATA: Record<string, ModuleData> = {
  hrms: {
    id: "hrms",
    shortName: "HRMS",
    category: "Workforce & Self-Service Portal",
    badgePill: "HR & WORKFORCE MANAGEMENT",
    gradientText: "from-blue-600 via-indigo-600 to-purple-600",
    headline: {
      line1: "Human Resource Management System",
      line2: "Multi-Role Workspaces For Firm & Clients",
    },
    tagline:
      "End-to-end employee lifecycle, dedicated role workspaces, and automated HR operations built for your practice and business clients.",
    icon: Users,
    headerAccent: "from-blue-500 via-indigo-500 to-blue-600",
    overview:
      "Our HRMS module empowers CA firms to run internal staff operations and offer a fully branded, multi-tenant HR portal to their business clients. From recruitment and digital onboarding to attendance biometric syncing, shift rosters, leave management, appraisals, and complete offboarding clearance — every role gets an isolated, dedicated dashboard.",
    stats: [
      {
        value: "6 Roles",
        label: "Dedicated Workspaces",
        icon: ShieldCheck,
        cardStyle: "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60",
        iconStyle: "bg-blue-600 text-white shadow-xs shadow-blue-500/20",
        valueStyle: "text-blue-900 dark:text-blue-200",
      },
      {
        value: "Hire to Retire",
        label: "Full Employee Lifecycle",
        icon: Users,
        cardStyle: "bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60",
        iconStyle: "bg-purple-600 text-white shadow-xs shadow-purple-500/20",
        valueStyle: "text-purple-900 dark:text-purple-200",
      },
      {
        value: "Self-Service",
        label: "Mobile & Web Portal",
        icon: Laptop,
        cardStyle: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60",
        iconStyle: "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20",
        valueStyle: "text-emerald-900 dark:text-emerald-200",
      },
      {
        value: "Tenant-Isolated",
        label: "Multi-Tenant Security",
        icon: Layers,
        cardStyle: "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60",
        iconStyle: "bg-amber-500 text-white shadow-xs shadow-amber-500/20",
        valueStyle: "text-amber-900 dark:text-amber-200",
      },
    ],
    roles: [
      {
        name: "Super Admin / HR Admin",
        badge: "Full Control",
        badgeBg: "bg-blue-100 dark:bg-blue-950/80",
        badgeColor: "text-blue-700 dark:text-blue-300",
        icon: ShieldCheck,
        summary: "Master administrative control over company policies, organizational hierarchies, and employee administration.",
        responsibilities: [
          "Configure company settings, multi-branch structures, departments, and designations.",
          "Digital employee onboarding with document verification and checklist automation.",
          "Issue digital letters (Offer Letter, Appointment, Appraisal, Relieving, Experience).",
          "Setup shift rosters, attendance rules, holiday calendars, and leave encashment policies.",
          "Manage recruitment pipelines, job postings, candidate evaluations, and hiring stages.",
          "Process resignations, conduct clearance handovers, and generate Full & Final (F&F) settlements.",
        ],
        keyFeatures: ["Company Hierarchy", "Letter Generation", "Roster Engine", "Exit Clearance"],
      },
      {
        name: "Manager",
        badge: "Team Management",
        badgeBg: "bg-purple-100 dark:bg-purple-950/80",
        badgeColor: "text-purple-700 dark:text-purple-300",
        icon: UserCheck,
        summary: "Empowers team leaders to supervise subordinates, review workflows, and evaluate performance.",
        responsibilities: [
          "Supervise assigned team members with live attendance and punctuality tracking.",
          "Approve or reject leave requests, attendance regularizations, and shift swap requests.",
          "Review and approve employee travel requests, advances, and expense reimbursement claims.",
          "Define team OKRs, assign milestone goals, and conduct quarterly performance appraisals.",
          "Participate in candidate interview rounds and submit candidate ratings & feedback.",
        ],
        keyFeatures: ["Approval Inboxes", "Team Attendance", "Goal Tracking", "Appraisal Reviews"],
      },
      {
        name: "Employee (Self-Service)",
        badge: "Self-Service",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
        badgeColor: "text-emerald-700 dark:text-emerald-300",
        icon: Briefcase,
        summary: "Personal workspace for every staff member to access essential workplace records and apply for requests.",
        responsibilities: [
          "Punch attendance online or view biometric punch logs with monthly calendar heatmap.",
          "Check real-time leave balances (Casual, Sick, Earned, Comp-off) and apply for leaves.",
          "Download monthly digital payslips with complete salary breakdown and annual tax sheets.",
          "Submit expense claims with receipt attachments and request travel advances.",
          "Track assigned goals, submit self-appraisal ratings, and review company policies.",
          "Submit digital resignation notices and monitor handover clearance progress.",
        ],
        keyFeatures: ["1-Click Attendance", "Payslip Download", "Leave Application", "Expense Claims"],
      },
      {
        name: "IT Admin",
        badge: "Asset & Security",
        badgeBg: "bg-amber-100 dark:bg-amber-950/80",
        badgeColor: "text-amber-700 dark:text-amber-300",
        icon: Laptop,
        summary: "Supervises hardware allocation, cloud software licenses, and IT security de-provisioning.",
        responsibilities: [
          "Manage IT asset inventory (Laptops, Desktops, Monitors, Mobile Devices, Peripherals).",
          "Allocate, reassign, and track hardware with serial numbers, condition tags, and warranties.",
          "Assign software seats and enterprise cloud tool licenses to onboarded employees.",
          "Manage physical and facility assets: Workstations, desks, lockers, access cards, and parking.",
          "Execute mandatory IT handover clearance and revoke credentials during employee exit.",
        ],
        keyFeatures: ["Hardware Inventory", "Software Licenses", "Access Cards", "IT Clearance"],
      },
      {
        name: "Finance Manager",
        badge: "Disbursement & Approvals",
        badgeBg: "bg-cyan-100 dark:bg-cyan-950/80",
        badgeColor: "text-cyan-700 dark:text-cyan-300",
        icon: Coins,
        summary: "Financial validation gatekeeper for salary releases, expense reimbursements, and final payouts.",
        responsibilities: [
          "Verify computed payroll batches, tax deductions, and statutory contribution summaries.",
          "Authorize and execute salary disbursements with bank-ready payment file generation.",
          "Verify and disburse employee expense reimbursements and travel advance settlements.",
          "Perform financial no-dues verification for resigning staff before settlement clearance.",
          "Maintain clear financial records for audit compliance and company accounting.",
        ],
        keyFeatures: ["Payroll Sign-off", "Reimbursement Payout", "No-Dues Sign-off", "Bank Batching"],
      },
      {
        name: "Auditor",
        badge: "Compliance & Audit",
        badgeBg: "bg-rose-100 dark:bg-rose-950/80",
        badgeColor: "text-rose-700 dark:text-rose-300",
        icon: FileCheck,
        summary: "Dedicated read-only inspection access for internal or external auditors and regulatory reviewers.",
        responsibilities: [
          "Read-only access to employee masters, employment contracts, and statutory documents.",
          "Audit attendance logs, shift history, overtime records, and leave register accuracy.",
          "Verify payroll registers, salary structures, PF/ESI deduction formulas, and TDS calculations.",
          "Generate statutory compliance reports, PF Form 5/10, ESI reports, and onboarding trails.",
          "Review historical audit logs for administrative actions and policy changes.",
        ],
        keyFeatures: ["Read-only Security", "Statutory Audit", "Payroll Verification", "Activity Trails"],
      },
    ],
    capabilities: [
      {
        title: "Recruitment & Onboarding",
        description: "Post openings, screen candidates through customized pipeline stages, and onboard with digital document verification.",
        icon: UserPlus,
        highlights: ["Job Openings & Pipeline", "Automated Offer Letters", "Onboarding Checklists", "Digital Document Locker"],
      },
      {
        title: "Attendance & Shift Roaster",
        description: "Flexible attendance capture with multi-shift scheduling, geofencing, regularization requests, and calendar analytics.",
        icon: Clock,
        highlights: ["Multi-shift Roaster", "Regularization Workflow", "Holiday Calendars", "Biometric Integration Ready"],
      },
      {
        title: "Leave & Encashment Rules",
        description: "Custom leave types (Casual, Sick, Maternity, Paternity, Comp-Off) with automatic accrual and encashment calculation.",
        icon: CalendarCheck,
        highlights: ["Configurable Quotas", "Leave Approval Inboxes", "Comp-off Credits", "Year-end Encashment"],
      },
      {
        title: "Asset & Facility Inventory",
        description: "Track laptops, monitors, software licenses, desks, lockers, and access cards throughout their entire operational life.",
        icon: Laptop,
        highlights: ["Hardware Serial Tracking", "Software Subscriptions", "Workstation & Locker Assignment", "Full Return Clearance"],
      },
    ],
    benefits: {
      forFirms: [
        "Eliminate separate costly HRMS subscriptions for your firm's internal team.",
        "Resell HRMS as an isolated subscription to your business clients for recurring monthly revenue.",
        "Complete visibility into client employee counts for accurate payroll billing.",
      ],
      forClients: [
        "Enterprise-grade HRMS without paying prohibitive enterprise software fees.",
        "Empowers employees with modern self-service apps on mobile and web.",
        "Instant seamless data connectivity with CA firm for flawless monthly payroll processing.",
      ],
    },
  },

  crm: {
    id: "crm",
    shortName: "CRM",
    category: "Practice Growth & Lead Pipeline",
    badgePill: "CLIENT RELATIONSHIP & PIPELINE",
    gradientText: "from-purple-600 via-fuchsia-600 to-pink-600",
    headline: {
      line1: "Client Relationship Management",
      line2: "Track Inquiries & Convert to Clients in 1-Click",
    },
    tagline:
      "Purpose-built lead tracking, automated recurring follow-ups, and one-click client conversion for modern CA firms.",
    icon: Contact2,
    headerAccent: "from-purple-500 via-fuchsia-500 to-pink-500",
    overview:
      "Built specifically for chartered accountants, tax consultants, and financial advisory firms. Eliminate scattered sticky notes and missed client inquiries. Track corporate leads, proprietorships, and individual clients through customized stages with automated follow-up scheduling, communication logs, and seamless conversion into active practice clients.",
    stats: [
      {
        value: "4 Stages",
        label: "Structured Pipeline",
        icon: Sliders,
        cardStyle: "bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60",
        iconStyle: "bg-purple-600 text-white shadow-xs shadow-purple-500/20",
        valueStyle: "text-purple-900 dark:text-purple-200",
      },
      {
        value: "1-Click Client",
        label: "Fast Conversion",
        icon: CheckCircle2,
        cardStyle: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60",
        iconStyle: "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20",
        valueStyle: "text-emerald-900 dark:text-emerald-200",
      },
      {
        value: "Omnichannel",
        label: "WhatsApp, Call & Mail",
        icon: MessageSquare,
        cardStyle: "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60",
        iconStyle: "bg-blue-600 text-white shadow-xs shadow-blue-500/20",
        valueStyle: "text-blue-900 dark:text-blue-200",
      },
      {
        value: "All Entities",
        label: "Individual, LLP & Co.",
        icon: Building2,
        cardStyle: "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60",
        iconStyle: "bg-amber-500 text-white shadow-xs shadow-amber-500/20",
        valueStyle: "text-amber-900 dark:text-amber-200",
      },
    ],
    capabilities: [
      {
        title: "Lead Acquisition & Classification",
        description: "Capture inbound leads and tag them by entity type (Individual, Proprietorship, LLP, Pvt Ltd) and desired services.",
        icon: UserPlus,
        highlights: ["Entity Type Categorization", "Estimated Deal Value", "Lead Source Tracking", "Custom Service Tagging"],
      },
      {
        title: "Visual Pipeline Stepper",
        description: "Move prospects intuitively across structured pipeline stages: New ➔ Contacted ➔ Qualified ➔ Won (or Lost with reason).",
        icon: Sliders,
        highlights: ["Kanban & List Views", "Stage Progression Stepper", "Loss Reason Analytics", "Win Probability Metrics"],
      },
      {
        title: "Communication & Activity Logs",
        description: "Log every client interaction — phone call summaries, WhatsApp chats, email exchanges, and scheduled consultation notes.",
        icon: MessageSquare,
        highlights: ["Call History Logs", "WhatsApp Follow-up Notes", "Email Records", "Staff Meeting Summaries"],
      },
      {
        title: "Instant Business Client Conversion",
        description: "When a lead is won, convert them into an active Business Client with 1 click. Zero duplicate data entry.",
        icon: CheckCircle2,
        highlights: ["Instant Tenant Creation", "Auto Service Assignment", "Direct Compliance Linking", "HRMS Plan Allocation"],
      },
    ],
    benefits: {
      forFirms: [
        "Never lose high-value audit, tax, or loan advisory leads due to forgotten follow-ups.",
        "Track which team members are converting leads most effectively.",
        "Unified view of client acquisition pipeline and projected revenue.",
      ],
      forClients: [
        "Fast, professional response times to all queries and consultation requests.",
        "Smooth, instant onboarding into the firm's client portal.",
      ],
    },
  },

  compliance: {
    id: "compliance",
    shortName: "Compliance Tool",
    category: "GST, TDS, Income Tax & ROC Management",
    badgePill: "STATUTORY FILINGS & DEADLINES",
    gradientText: "from-emerald-600 via-teal-600 to-cyan-600",
    headline: {
      line1: "Statutory Compliance Engine",
      line2: "GST, TDS, ROC & Tax Deadline Automation",
    },
    tagline:
      "Never miss a statutory filing deadline with pre-loaded recurring templates, staff allocation, and proof archiving.",
    icon: ClipboardCheck,
    headerAccent: "from-emerald-500 via-teal-500 to-cyan-500",
    overview:
      "A dedicated statutory compliance engine designed to manage the high-volume filing calendar of CA firms. Pre-loaded with standard catalogs for GST (GSTR-1, 3B, 9), TDS (24Q, 26Q), ROC (AOC-4, MGT-7), and Income Tax. Features recurring auto-spawning tasks, interactive monthly calendar views, staff task assignment, and document attachment storage for challans and acknowledgments.",
    stats: [
      {
        value: "GST, TDS & ROC",
        label: "Pre-loaded Catalogs",
        icon: FileText,
        cardStyle: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60",
        iconStyle: "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20",
        valueStyle: "text-emerald-900 dark:text-emerald-200",
      },
      {
        value: "Auto-Spawning",
        label: "Recurring Schedules",
        icon: Clock,
        cardStyle: "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60",
        iconStyle: "bg-blue-600 text-white shadow-xs shadow-blue-500/20",
        valueStyle: "text-blue-900 dark:text-blue-200",
      },
      {
        value: "Live Calendar",
        label: "Due Date Tracking",
        icon: CalendarCheck,
        cardStyle: "bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60",
        iconStyle: "bg-purple-600 text-white shadow-xs shadow-purple-500/20",
        valueStyle: "text-purple-900 dark:text-purple-200",
      },
      {
        value: "100% Proofs",
        label: "Challan & ARN Storage",
        icon: Download,
        cardStyle: "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60",
        iconStyle: "bg-amber-500 text-white shadow-xs shadow-amber-500/20",
        valueStyle: "text-amber-900 dark:text-amber-200",
      },
    ],
    capabilities: [
      {
        title: "Pre-loaded Statutory Catalog",
        description: "Ready-to-use templates for GST returns (GSTR-1, 3B, 9, CMP-08), TDS quarterly statements, ROC annual forms, and ITRs.",
        icon: FileText,
        highlights: ["GSTR-1, 3B, 9, 9C", "TDS 24Q, 26Q, 27Q", "ROC AOC-4, MGT-7, DIR-3", "Advance Tax & ITR 1-7"],
      },
      {
        title: "Recurring Task Spawning",
        description: "Set up client tasks once with monthly, quarterly, or annual recurrence. The system spawns subsequent cycles automatically.",
        icon: Clock,
        highlights: ["One-Time & Recurring Rules", "Automated Due Date Calculation", "Batch Task Generation", "Zero Manual Overheads"],
      },
      {
        title: "Interactive Compliance Calendar",
        description: "A bird's eye view of all upcoming firm-wide deadlines color-coded by urgency: Upcoming, Due Today, and Overdue.",
        icon: CalendarCheck,
        highlights: ["Monthly & Weekly Grids", "Urgency Indicators", "Client-wise Filtering", "Staff Workload Distribution"],
      },
      {
        title: "Challan & Proof Archiving",
        description: "Upload and attach filing acknowledgment receipts, ARN numbers, and bank tax payment challans directly to the task.",
        icon: Download,
        highlights: ["Digital Proof Attachment", "ARN Number Tagging", "Instant Client Sharing", "Historical Audit Retrieval"],
      },
    ],
    benefits: {
      forFirms: [
        "Eliminate late filing penalty notices and interest damages for your clients.",
        "Assign and track junior staff filing workloads with accountable review stages.",
        "Transparent tracking of filing status across 100+ clients simultaneously.",
      ],
      forClients: [
        "Peace of mind knowing all statutory filings are scheduled and tracked proactively.",
        "Instant access to download filing acknowledgments and tax challan copies.",
      ],
    },
  },

  "finance-tracker": {
    id: "finance-tracker",
    shortName: "Personal Finance Tracker",
    category: "Client Wealth & Debt Advisory",
    badgePill: "WEALTH HEALTH & DEBT ADVISORY",
    gradientText: "from-amber-500 via-orange-500 to-red-500",
    headline: {
      line1: "Personal Finance Tracker",
      line2: "5-Step Health Scoring & Wealth Advisory",
    },
    tagline:
      "5-step financial profiling, automated health scoring, debt-to-income analysis, and branded PDF advisory reports for banks and wealth consultation.",
    icon: PiggyBank,
    headerAccent: "from-amber-500 via-orange-500 to-red-500",
    overview:
      "Transcend traditional static spreadsheets with a dynamic 5-step financial workspace. Profile your business clients' personal and corporate finances: income streams, active loans, monthly living expenses, and investment portfolios. Generate automated Financial Health Scores, evaluate Debt-to-Income (DTI) metrics, simulate loan consolidation scenarios, and export professional, client-branded PDF advisory reports for banks and wealth management.",
    stats: [
      {
        value: "5 Steps",
        label: "Guided Profiling",
        icon: Sliders,
        cardStyle: "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60",
        iconStyle: "bg-amber-500 text-white shadow-xs shadow-amber-500/20",
        valueStyle: "text-amber-900 dark:text-amber-200",
      },
      {
        value: "Health Score",
        label: "Algorithmic DTI Rating",
        icon: BarChart3,
        cardStyle: "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60",
        iconStyle: "bg-blue-600 text-white shadow-xs shadow-blue-500/20",
        valueStyle: "text-blue-900 dark:text-blue-200",
      },
      {
        value: "Real-time",
        label: "Loan EMI Simulation",
        icon: TrendingUp,
        cardStyle: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60",
        iconStyle: "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20",
        valueStyle: "text-emerald-900 dark:text-emerald-200",
      },
      {
        value: "Branded PDF",
        label: "Client Advisory Reports",
        icon: Download,
        cardStyle: "bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60",
        iconStyle: "bg-purple-600 text-white shadow-xs shadow-purple-500/20",
        valueStyle: "text-purple-900 dark:text-purple-200",
      },
    ],
    capabilities: [
      {
        title: "5-Step Comprehensive Profiling",
        description: "A guided workspace covering Personal KYC, Income Streams, Active Loans & EMIs, Monthly Expenses, and Savings Assets.",
        icon: Sliders,
        highlights: ["Salary & Business Income", "Loan Liabilities & Interest", "Discretionary Household Costs", "Mutual Funds & Real Estate"],
      },
      {
        title: "Automated Financial Health Score",
        description: "Instant algorithmic rating (Excellent, Good, Moderate, Stressed) based on Debt-to-Income (DTI) ratios and net cash surplus.",
        icon: BarChart3,
        highlights: ["DTI Ratio Calculation", "Net Monthly Surplus/Deficit", "Financial Stress Index", "Surplus Liquidity Metrics"],
      },
      {
        title: "Loan Restructuring & Advisory Simulation",
        description: "Simulate EMI prepayment scenarios, tenure adjustments, interest balance transfers, and debt consolidation strategies.",
        icon: TrendingUp,
        highlights: ["Side-by-side Scenario Comparison", "Foreclosure Interest Savings", "Tenure Optimization", "Consolidation Planning"],
      },
      {
        title: "Branded PDF Advisory Reports",
        description: "1-click export to a clean, professional financial advisory document complete with your CA firm logo and chart summaries.",
        icon: Download,
        highlights: ["Firm-Branded PDF Header", "Income vs Expense Breakdown", "Loan Liability Summary", "Bank Loan Submission Ready"],
      },
    ],
    benefits: {
      forFirms: [
        "Open a high-margin secondary revenue stream through retail wealth and loan advisory services.",
        "Provide evidence-backed loan eligibility consultation for client bank loan applications.",
        "Strengthen client relationships with actionable personal financial roadmaps.",
      ],
      forClients: [
        "Clear, visual clarity on personal cash flows and debt burden.",
        "Optimized loan repayment strategies that save substantial interest money.",
      ],
    },
  },

  payroll: {
    id: "payroll",
    shortName: "Payroll",
    category: "Salary Structures & Bank Payment Files",
    badgePill: "MULTI-CLIENT SALARY & STATUTORY",
    gradientText: "from-cyan-600 via-sky-600 to-blue-600",
    headline: {
      line1: "Automated Multi-Client Payroll",
      line2: "Statutory Formulas & Direct Bank Payouts",
    },
    tagline:
      "Run monthly payroll with Indian statutory rules (PF, ESI, PT, TDS), digital payslips, and 1-click NEFT/RTGS bank disbursement files.",
    icon: Wallet,
    headerAccent: "from-cyan-500 via-sky-500 to-blue-600",
    overview:
      "A complete multi-client payroll processing engine built for CA firms. Set up custom salary structures with Indian statutory rules (PF, ESI, Professional Tax, TDS). Execute monthly payroll runs based on attendance or manual inputs, generate secure employee payslips, produce bank-ready NEFT/RTGS payment disbursement files, and export compliance registers effortlessly.",
    stats: [
      {
        value: "Statutory",
        label: "PF, ESI, PT & TDS Ready",
        icon: Sliders,
        cardStyle: "bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-900/60",
        iconStyle: "bg-cyan-600 text-white shadow-xs shadow-cyan-500/20",
        valueStyle: "text-cyan-900 dark:text-cyan-200",
      },
      {
        value: "NEFT / RTGS",
        label: "Bank Payment Files",
        icon: DollarSign,
        cardStyle: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60",
        iconStyle: "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20",
        valueStyle: "text-emerald-900 dark:text-emerald-200",
      },
      {
        value: "Auto Payslips",
        label: "PDF & Portal Access",
        icon: FileText,
        cardStyle: "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60",
        iconStyle: "bg-blue-600 text-white shadow-xs shadow-blue-500/20",
        valueStyle: "text-blue-900 dark:text-blue-200",
      },
      {
        value: "Dual Mode",
        label: "HRMS & Non-HRMS",
        icon: Building2,
        cardStyle: "bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60",
        iconStyle: "bg-purple-600 text-white shadow-xs shadow-purple-500/20",
        valueStyle: "text-purple-900 dark:text-purple-200",
      },
    ],
    capabilities: [
      {
        title: "Customizable Salary Structures",
        description: "Configure earnings (Basic, HRA, DA, Special Allowance) and automatic statutory formulas for Employee & Employer PF and ESI.",
        icon: Sliders,
        highlights: ["Basic, HRA & Allowances", "EPF 12% Calculation", "ESIC Contribution Formulas", "State Professional Tax (PT)"],
      },
      {
        title: "Batch Monthly Payroll Execution",
        description: "Run monthly payroll in seconds. Automatically pull approved attendance from HRMS or upload excel inputs for external clients.",
        icon: Clock,
        highlights: ["1-Click Monthly Batching", "Attendance & Leave Sync", "Overtime & Deductions", "Approval & Locking Gate"],
      },
      {
        title: "Bank-Ready Payment Files",
        description: "Generate formatted disbursement files for HDFC, ICICI, SBI, Axis, and other major banks for direct salary credit in 1 click.",
        icon: DollarSign,
        highlights: ["NEFT / RTGS Formats", "Bulk Account Credit", "Zero Manual Bank Entry", "Audit Approved Format"],
      },
      {
        title: "Statutory Reporting & Tax Computation",
        description: "Generate EPF Electronic Challan Return (ECR) files, ESIC contribution summaries, and Form 24Q quarterly annexures.",
        icon: FileText,
        highlights: ["EPF ECR Text Format", "ESIC Monthly Contribution", "Quarterly TDS 24Q Annexures", "Annual Tax Estimation Sheets"],
      },
    ],
    benefits: {
      forFirms: [
        "Deliver professional payroll outsourcing services to 50+ clients without hiring extra payroll staff.",
        "Eliminate calculation errors and manual formula maintenance in excel sheets.",
        "Seamless synchronization with the compliance module for timely PF and ESI return filings.",
      ],
      forClients: [
        "100% on-time salary disbursements with zero compliance discrepancies.",
        "Employees receive timely, professional payslips directly on their self-service portal.",
      ],
    },
  },
};

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId?: string }>();
  const navigate = useNavigate();

  // Selected module or default to 'hrms'
  const activeModuleKey = moduleId && MODULES_DATA[moduleId] ? moduleId : "hrms";
  const mod = MODULES_DATA[activeModuleKey];

  // Active Role tab in HRMS
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);

  // Scroll to top when module changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveRoleIndex(0);
  }, [activeModuleKey]);

  return (
    <div className="relative min-h-screen bg-[#f8faff] dark:bg-[#0a0b12] text-slate-800 dark:text-slate-100 transition-colors pb-24">
      {/* Top Breadcrumb & Switcher Navigation */}
      <div className="sticky top-16 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/#modules"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Overview
          </Link>

          {/* Module Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {Object.values(MODULES_DATA).map((item) => {
              const isActive = item.id === activeModuleKey;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/modules/${item.id}`)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hero Banner with Soft Ambient Colors */}
      <section className="relative overflow-hidden px-4 pt-12 pb-14 md:px-6 md:pt-16 bg-gradient-to-b from-white via-blue-50/30 to-[#f8faff] dark:from-slate-950 dark:via-slate-900/60 dark:to-[#0a0b12] border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="pointer-events-none absolute -left-20 top-0 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-10 -z-10 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="mx-auto max-w-5xl">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 shadow-2xs">
            <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
            <span>{mod.badgePill}</span>
          </div>

          {/* Full-width clean headline with gradient highlight */}
          <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.18]">
            {mod.headline.line1}
            <br />
            <span className={`bg-gradient-to-r ${mod.gradientText} bg-clip-text text-transparent font-extrabold`}>
              {mod.headline.line2}
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {mod.tagline}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02]"
            >
              Start Free 14-Day Trial <ArrowRight size={16} />
            </Link>
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              Explore Capabilities
            </a>
          </div>

          {/* 4 Colorful & Perfectly Proportioned Stat Cards (No Text Overflow) */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mod.stats.map((s) => {
              const StatIcon = s.icon;
              return (
                <div
                  key={s.label}
                  className={`rounded-2xl border p-4 transition-all shadow-xs flex items-center gap-3.5 ${s.cardStyle}`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconStyle}`}>
                    <StatIcon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-base sm:text-lg font-bold truncate leading-tight ${s.valueStyle}`}>
                      {s.value}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                      {s.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 space-y-14">
        {/* Module Deep Overview */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-7 sm:p-9 shadow-xs relative overflow-hidden">
          <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${mod.headerAccent}`} />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Module Architecture &amp; Overview</h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">{mod.overview}</p>
        </section>

        {/* SPECIAL SECTION: HRMS ROLES BREAKDOWN (Rendered if HRMS) */}
        {mod.roles && mod.roles.length > 0 && (
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50 dark:border-purple-900/60 dark:bg-purple-950/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                <ShieldCheck size={13} /> Complete Role-Based Access Control
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                Six Dedicated Workspaces, One HRMS
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                Each stakeholder logs into a tailored portal displaying only what is relevant to their job.
              </p>
            </div>

            {/* Role Tabs Nav */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
              {mod.roles.map((r, i) => {
                const isSelected = i === activeRoleIndex;
                const Icon = r.icon;
                return (
                  <button
                    key={r.name}
                    onClick={() => setActiveRoleIndex(i)}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{r.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Role Detailed Card */}
            {(() => {
              const currentRole = mod.roles[activeRoleIndex];
              const RoleIcon = currentRole.icon;
              return (
                <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-9 shadow-sm relative overflow-hidden transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
                        <RoleIcon size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{currentRole.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${currentRole.badgeBg} ${currentRole.badgeColor}`}>
                            {currentRole.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentRole.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Responsibilities & Features Grid */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Operational Responsibilities &amp; Workflows
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {currentRole.responsibilities.map((resp, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-700/50"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mt-0.5">
                              <Check size={12} strokeWidth={2.5} />
                            </span>
                            <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{resp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Feature Access</h4>
                      <div className="flex flex-col gap-2">
                        {currentRole.keyFeatures.map((feat) => (
                          <div
                            key={feat}
                            className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-850 p-3 shadow-2xs"
                          >
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{feat}</span>
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 p-4 border border-blue-100 dark:border-blue-900/50">
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Isolation Guarantee
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-normal">
                          This role is strictly bounded to the assigned tenant workspace and verified on every API request.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* Core Capabilities Section */}
        <section id="capabilities" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Sparkles size={12} /> Built For Execution
            </span>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Key Capabilities &amp; Features</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Everything built into our software to automate and streamline this function.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mod.capabilities.map((cap) => {
              const CapIcon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                        <CapIcon size={19} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cap.title}</h3>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{cap.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                    {cap.highlights.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits Section: Why CA Firms & Clients Love It */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-7 sm:p-9 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Why This Transforms Practice Work</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
              Tangible value delivered to both your chartered accountant firm and your clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-white dark:bg-slate-850 p-6 shadow-xs">
              <div className="flex items-center gap-2.5 text-base font-bold text-blue-600 dark:text-blue-400 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building2 size={18} /> For Your CA Firm
              </div>
              <ul className="mt-4 space-y-3">
                {mod.benefits.forFirms.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-white dark:bg-slate-850 p-6 shadow-xs">
              <div className="flex items-center gap-2.5 text-base font-bold text-emerald-600 dark:text-emerald-400 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Users size={18} /> For Your Business Clients
              </div>
              <ul className="mt-4 space-y-3">
                {mod.benefits.forClients.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Bottom CTA Card - Soft, Modern, Elegant (No dark harsh solid block) */}
        <section className="rounded-3xl border border-blue-200/70 dark:border-slate-800 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-850 p-8 sm:p-12 text-center relative overflow-hidden shadow-xs">
          {/* Subtle ambient glows */}
          <div className="pointer-events-none absolute -left-10 top-0 -z-0 h-56 w-56 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 -z-0 h-56 w-56 rounded-full bg-indigo-400/10 blur-2xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Sparkles size={12} /> Instant Setup · 14-Day Free Trial
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ready to get started with <span className="text-blue-600 dark:text-blue-400">{mod.shortName}</span>?
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Start with all 5 modules immediately. Onboard your firm's staff and invite your first business clients within minutes.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02]"
              >
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs"
              >
                Log In to Workspace
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
