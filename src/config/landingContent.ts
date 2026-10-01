import {
  Users,
  Handshake,
  ClipboardCheck,
  PiggyBank,
  Wallet,
  Landmark,
  Building2,
  Briefcase,
} from "lucide-react";

// Public marketing copy for the landing page's clickable "modules" and "tiers"
// boxes and their detail pages (/modules/:slug, /platform/:slug). Written from
// what the product actually does today (BRD, Role Matrix, Module Scope and
// Multi-Tenancy docs + the shipped screens) — keep it in sync when features change.

export type FeatureGroup = { heading: string; points: string[] };

export type LandingItem = {
  slug: string;
  icon: any;
  title: string;
  // Short line on the landing-page box.
  desc: string;
  // Detail page.
  tagline: string;
  overview: string[];
  audience: { who: string; access: string }[];
  features: FeatureGroup[];
  notifications?: string[];
  highlights: string[];
};

export const MODULES: LandingItem[] = [
  {
    slug: "crm",
    icon: Handshake,
    title: "CRM",
    desc: "Capture leads, schedule follow-ups, keep a full activity history and convert prospects into onboarded clients.",
    tagline: "From first enquiry to signed client — every lead, follow-up and conversation in one place.",
    overview: [
      "The CRM is where a CA firm's growth starts. Every enquiry — a phone call, a WhatsApp message, a walk-in or a referral — is captured as a lead with its contact details, the services the person needs and where the lead came from.",
      "Leads move through a clear pipeline (New → Contacted → Qualified → Converted, or Lost with a reason), and every stage change is written to the lead's history with who changed it and when. Once a lead is won it becomes a client, and from there it can be onboarded as a Business Client with HRMS or Excel-based payroll in a couple of clicks.",
    ],
    audience: [
      { who: "CA Firm Admin", access: "Sees every lead in the firm, assigns and reassigns leads, deletes records and sees the firm-wide dashboard." },
      { who: "CA Firm Staff", access: "Works only the leads assigned to them — add, edit, follow up and add notes — and sees their own performance." },
    ],
    features: [
      {
        heading: "Lead capture",
        points: [
          "Lead types: individual, business, startup, company or existing-client referral",
          "Mobile, alternate mobile and email, with business name, business type, industry and city for business leads",
          "Services required — GST registration & filing, income tax return, TDS, ROC compliance, audit, accounting & bookkeeping, financial statements, loan advisory and more",
          "Lead source tracking: website, phone call, WhatsApp, email, referral, social media, advertisement, walk-in",
          "Priority, estimated deal value and expected closing date",
        ],
      },
      {
        heading: "Pipeline & conversion",
        points: [
          "Pipeline view by stage, with one-click Advance Stage and Mark Lost (with reason)",
          "Complete stage history — who moved the lead, when, and why",
          "Won leads appear in a dedicated Clients tab",
          "Convert a client into a Business Client — with or without HRMS — straight from the CRM",
        ],
      },
      {
        heading: "Follow-ups & activity",
        points: [
          "Schedule follow-ups by call, email, WhatsApp or meeting, with date, time and a note",
          "Timestamped notes & activity log with staff attribution",
          "Lead assignment to staff — staff only ever see what's assigned to them",
        ],
      },
      {
        heading: "Dashboard",
        points: [
          "Counts by pipeline stage, conversions and lost leads",
          "Filter by staff member and date range",
          "Search by name, company or email",
        ],
      },
    ],
    notifications: [
      "Follow-up reminder to the lead/client on WhatsApp and email on the follow-up date",
      "The assigned staff member gets an in-app and email reminder the same morning",
      "Staff are notified when a lead is assigned to them",
      "A welcome message goes to the client when a lead is converted",
      "Each lead can be opted out of email or WhatsApp individually",
    ],
    highlights: ["Role-scoped visibility", "Full stage history", "Automated follow-up reminders", "One-click client onboarding"],
  },
  {
    slug: "compliance-tool",
    icon: ClipboardCheck,
    title: "Compliance Tool",
    desc: "GST, TDS, ROC and Income Tax tasks per client — assigned to staff, tracked on a calendar, with automatic deadline reminders.",
    tagline: "Never miss a statutory deadline — for any client, on any staff member's desk.",
    overview: [
      "The Compliance Tool is a checklist- and calendar-based tracker for every statutory filing the firm handles. Tasks such as monthly GST returns, quarterly TDS or annual ROC filings are created from ready templates, tied to a client and assigned to a staff member.",
      "It is deliberately manual: there's no auto-filing and no scraping of government portals. Staff move each task from Pending to In Progress to Done, attach the supporting documents and proof of filing, and the system takes care of tracking, reminders and the audit trail.",
    ],
    audience: [
      { who: "CA Firm Admin", access: "Sees, creates, reassigns and deletes every task across all clients." },
      { who: "CA Firm Staff", access: "Sees and updates the tasks assigned to them, creates tasks for their own clients and attaches proof of filing." },
    ],
    features: [
      {
        heading: "Tasks & templates",
        points: [
          "Categories: GST, TDS, ROC, Income Tax and Other",
          "Recurrence: one-time, monthly, quarterly or annual",
          "Start from a template to pre-fill the title, category and recurrence",
          "Each task is linked to a client and an assigned staff member",
        ],
      },
      {
        heading: "Tracking",
        points: [
          "Status: Pending → In Progress → Done, updated by staff",
          "Calendar view of every due date across all clients",
          "List view with filters by status and category",
          "Dashboard: pending, in-progress, completed and overdue counts",
        ],
      },
      {
        heading: "Documents & notes",
        points: [
          "Document checklist per task — tick items off as they arrive",
          "Upload supporting documents and proof of filing directly to the task",
          "Notes with staff name and timestamp",
        ],
      },
    ],
    notifications: [
      "Deadline alerts to the business client on WhatsApp and email — 7, 3 and 1 day before and on the due date",
      "The assigned staff member gets matching in-app and email reminders",
      "An overdue alert goes to staff the day after a missed deadline",
      "The client is told when their filing is marked Done",
      "Staff are notified when a task is assigned to them",
    ],
    highlights: ["Recurring templates", "Calendar of every deadline", "Proof-of-filing uploads", "Automatic client reminders"],
  },
  {
    slug: "personal-finance-tracker",
    icon: PiggyBank,
    title: "Personal Finance Tracker",
    desc: "Income, expenses, EMIs and savings in one profile — with financial-health score, loan eligibility, projections and a shareable report.",
    tagline: "Advise clients on loans and savings with numbers they can see — and take home.",
    overview: [
      "The Personal Finance Tracker (the evolution of the Loan Calculator) lets the firm build a complete financial picture of a client: monthly income, every running loan EMI, household expenses and current savings.",
      "From that profile it calculates monthly surplus or deficit, FOIR (the share of income going to EMIs) and a financial-health rating, estimates how much more the person could borrow, and projects how their savings could grow. The whole analysis can be downloaded as a PDF report or sent straight to the client by email and WhatsApp.",
    ],
    audience: [
      { who: "CA Firm Admin", access: "Sees and manages every finance profile in the firm." },
      { who: "CA Firm Staff", access: "Creates and works on their own profiles, and can share reports with clients." },
    ],
    features: [
      {
        heading: "Client profile",
        points: [
          "Pick an existing client (auto-fills their details) or add a new person",
          "Personal details, company, designation, experience and GSTIN",
          "Monthly income and current monthly savings",
          "Running loans — home, car, personal, plus any number of other loans with their EMIs",
          "Monthly expenses: rent, groceries, utilities, transport, insurance, education, lifestyle and other",
        ],
      },
      {
        heading: "Analysis",
        points: [
          "Monthly surplus or deficit after expenses and EMIs",
          "FOIR and savings rate, with a financial-health rating (Excellent / Good / Moderate / Stressed)",
          "Loan eligibility — additional EMI capacity and the maximum new loan at a chosen interest rate and tenure",
          "Investment projection of monthly savings over multiple horizons at an assumed return",
          "Charts for income vs outflow and the expense breakdown",
        ],
      },
      {
        heading: "Reports & sharing",
        points: [
          "Download a formatted PDF report",
          "Send Report — email the PDF and send it on WhatsApp in one click",
          "Clear feedback on what was delivered on each channel",
        ],
      },
    ],
    notifications: [
      "Report sharing by email (PDF attached) and WhatsApp (summary + PDF)",
      "Respects the client's channel opt-outs and WhatsApp STOP replies",
    ],
    highlights: ["Financial-health score", "Loan eligibility", "Savings projections", "PDF + WhatsApp sharing"],
  },
  {
    slug: "payroll-management",
    icon: Wallet,
    title: "Payroll Management",
    desc: "Run monthly payroll for every client — Excel-based or through their HRMS — with payslips, statutory components and bank payment files.",
    tagline: "Process payroll for every client the firm serves — whether or not they use HRMS.",
    overview: [
      "Payroll Management gives the CA firm one list of every client it runs payroll for: Business Clients on full HRMS, clients on simple Excel-based payroll, and converted CRM clients that haven't been onboarded yet (they're set up automatically the first time payroll is opened).",
      "For Excel-based clients the firm defines the salary structure once, imports each month's figures from a ready-made Excel template, runs payroll and generates payslips and a bank payment file. For HRMS clients the firm opens that client's own HRMS payroll screens directly and runs payroll on their behalf.",
    ],
    audience: [
      { who: "CA Firm Admin", access: "Runs payroll for every client, configures salary structures and generates payslips and payment files." },
      { who: "Business Client owner", access: "Optionally approves each month's payroll from a secure, password-protected link before it's processed." },
    ],
    features: [
      {
        heading: "Salary structure",
        points: [
          "Basic as a % of CTC or a fixed amount; other components as % of Basic or fixed",
          "Statutory components such as Employee/Employer PF and ESI calculated automatically",
          "Per-employee overrides when someone's structure differs from the client default",
          "CTC check that flags rows where Gross + employer contributions don't add up",
          "Cost-center tagging per employee",
        ],
      },
      {
        heading: "Monthly run",
        points: [
          "Downloadable Excel template with the columns you choose, in your order",
          "Upload, preview and confirm before anything is saved",
          "Run payroll per month, with earnings, deductions, gross and net pay",
          "Run history and month-wise detail; export to Excel",
          "Employee master for each client, including bank details",
        ],
      },
      {
        heading: "Payouts & payslips",
        points: [
          "Payslip PDF per employee",
          "Bank payment file generated from the run and exportable",
          "Owner payroll approval by email before processing (optional)",
          "HRMS clients: run payroll inside their own HRMS through secure single sign-on",
        ],
      },
    ],
    highlights: ["Excel or HRMS payroll", "Statutory PF/ESI", "Payslips & bank files", "Owner approval"],
  },
  {
    slug: "hrms",
    icon: Users,
    title: "HRMS",
    desc: "A complete HR system for each business client — employees, attendance, leave, payroll, recruitment, assets and self-service.",
    tagline: "A full HR system the CA firm can give every business client — completely isolated from all others.",
    overview: [
      "HRMS is the value-added service a CA firm extends to its own business clients. Each business client gets its own isolated HR workspace, branded with its own company name, with logins for its HR team, managers, finance, IT and every employee.",
      "It covers the whole employee lifecycle — onboarding, attendance and shifts, leave, approvals, payroll and payslips, recruitment, assets and exit clearance — while the CA firm keeps read-only oversight and can run payroll on the client's behalf.",
    ],
    audience: [
      { who: "HR / Business Client Admin", access: "Full control of their own company: employees, policies, leave, attendance, payroll and reports." },
      { who: "Manager", access: "Manages their team — attendance, leave, approvals and performance goals." },
      { who: "Finance", access: "Approves expenses and travel, reviews payroll and disburses salaries, and sees statutory reports." },
      { who: "IT Admin", access: "System accounts, software licences, asset inventory and exit clearance." },
      { who: "Auditor", access: "Read-only access to employee, leave, attendance, payroll and compliance reports." },
      { who: "Employee", access: "Self-service: profile, documents, attendance, leave, requests and payslips." },
    ],
    features: [
      {
        heading: "Core HR",
        points: [
          "Employee master with company-based employee IDs, probation tracking and bulk Excel upload",
          "Branches, departments, designations, cost centers and company policies",
          "Employee documents, onboarding checklist and tasks, offer and other letters",
          "Import/export of every module's data",
        ],
      },
      {
        heading: "Time & leave",
        points: [
          "Self check-in attendance, attendance requests and an attendance calendar",
          "Shift roster with single and bulk shift assignment, plus a holiday calendar",
          "Leave types and rules, leave balance, balance override and leave encashment",
          "Overtime requests",
        ],
      },
      {
        heading: "Approvals & requests",
        points: [
          "Employees raise leave, attendance, travel, expense, overtime and profile-update requests",
          "Managers approve or reject their team's requests",
          "Finance approves expenses and marks payments as paid",
          "Resignation, clearance and final settlement",
        ],
      },
      {
        heading: "Payroll & compliance",
        points: [
          "Salary structures and monthly payroll runs",
          "Payslip generation and employee payslip downloads",
          "Statutory compliance reports",
          "Optional owner approval of each month's payroll",
        ],
      },
      {
        heading: "Recruitment, assets & IT",
        points: [
          "Job openings, candidates and the interview pipeline",
          "Asset inventory, assignment, return and non-IT assets",
          "System accounts, software licences and licence expiry",
          "Workstations, access cards, lockers and parking",
        ],
      },
      {
        heading: "Learning",
        points: ["Training modules with assessments for new joiners", "Goals, self-appraisal and feedback"],
      },
    ],
    notifications: [
      "Leave approved/rejected — in-app, email and WhatsApp to the employee",
      "New leave requests go to the employee's manager or HR",
      "Attendance requests, shifts, payslips, letters and resignation decisions",
      "Travel, expense, encashment, overtime and profile-update decisions, and payments",
      "Welcome message with login details for every new employee",
      "Every email carries the client's own company name",
    ],
    highlights: ["Isolated per business client", "Six built-in roles", "Full employee lifecycle", "Self-service portal"],
  },
];

export const TIERS: LandingItem[] = [
  {
    slug: "platform-owner",
    icon: Landmark,
    title: "Tier 1 — Platform Owner",
    desc: "Manages licensing, onboards CA firms, and oversees the whole platform.",
    tagline: "The Super Admin runs the platform as a business — licences, billing and support — without touching any firm's client data.",
    overview: [
      "The platform owner is the Chartered Accountant who built Praxis and licenses it to other CA firms. As Super Admin they onboard new licensee firms, decide each firm's plan and limits, track subscriptions and payments, and keep the platform healthy.",
      "By design the Super Admin has no default access to any firm's CRM, compliance or HRMS data. They see licensing, billing and aggregate counts only, so every licensee can trust that their clients' information stays theirs.",
    ],
    audience: [{ who: "Super Admin", access: "Platform administration only — no access to tenants' operational data." }],
    features: [
      {
        heading: "Licensing & onboarding",
        points: [
          "Onboard a CA firm with ICAI registration, PAN, GSTIN, constitution and address",
          "Admin account created automatically, with credentials sent by email and WhatsApp",
          "Plans — Starter, Growth, Enterprise — with staff-seat and business-client limits",
          "Trial length, plan status, billing cycle and expiry managed per firm",
          "Reset a firm admin's password when needed",
        ],
      },
      {
        heading: "Billing & revenue",
        points: [
          "Plan pricing set centrally; firms renew online through Razorpay",
          "Billing overview and per-firm payment history",
          "HRMS plan tiers for business clients",
          "WhatsApp message quota per tier, with per-firm usage and overage",
        ],
      },
      {
        heading: "Oversight",
        points: [
          "Dashboard and reports across all firms",
          "Business clients and users — counts and status, not their data",
          "Support tickets raised by firms, with replies",
          "Audit logs of sensitive actions",
          "Platform announcements to all firms or one firm, and maintenance mode",
        ],
      },
    ],
    highlights: ["Licence lifecycle", "Online renewals", "Zero access to client data", "Audit trail"],
  },
  {
    slug: "licensee-ca-firm",
    icon: Building2,
    title: "Tier 2 — Licensee CA Firm",
    desc: "CRM, Compliance, Personal Finance Tracker and Payroll — to run their own practice and serve their clients.",
    tagline: "Everything a CA practice needs to run day to day — and to serve its business clients.",
    overview: [
      "Each licensee CA firm — including the platform owner's own practice — gets its own fully isolated workspace. The firm's partners and staff run their practice there: winning clients in the CRM, tracking statutory deadlines, advising on personal finance and loans, and processing payroll.",
      "The firm also onboards its own business clients, and can give each of them an HRMS of their own as a value-added service. The firm keeps read-only oversight of those clients' HR data and can run payroll for them.",
    ],
    audience: [
      { who: "CA Firm Admin", access: "Owner/partner — full control of the firm's modules, staff, business clients, subscription and settings." },
      { who: "CA Firm Staff", access: "Article assistants and accountants — work on assigned leads and tasks, with module access the admin controls." },
    ],
    features: [
      {
        heading: "Practice modules",
        points: [
          "CRM — leads, pipeline, follow-ups and conversion",
          "Compliance Tool — GST/TDS/ROC/Income Tax tasks, calendar and reminders",
          "Personal Finance Tracker — financial health, loan eligibility and shareable reports",
          "Payroll Management — Excel or HRMS payroll for every client",
        ],
      },
      {
        heading: "Team",
        points: [
          "Add staff within the plan's seat limit",
          "Per-staff module permissions — show or hide CRM, Compliance and Finance Tracker, and grant add/edit/delete",
          "Staff see only the leads and tasks assigned to them",
        ],
      },
      {
        heading: "Business clients",
        points: [
          "Onboard clients directly or from won CRM leads",
          "Choose HRMS (with an HRMS plan) or simple Excel-based payroll — and upgrade later",
          "Client admin login invited by email and WhatsApp",
          "Public, password-protected employee onboarding form for non-HRMS clients",
        ],
      },
      {
        heading: "Subscription",
        points: [
          "Current plan, expiry countdown and online renewal",
          "7-day grace period after expiry, then read-only access until renewal",
          "WhatsApp messages used against the plan's included quota",
        ],
      },
    ],
    notifications: [
      "Automated WhatsApp and email to clients and leads for deadlines, follow-ups and reports",
      "In-app and email alerts to staff for assignments and due dates",
      "Each user chooses their own channels",
    ],
    highlights: ["Isolated firm workspace", "Seat-based team", "Client onboarding", "Grace-period renewals"],
  },
  {
    slug: "business-client",
    icon: Briefcase,
    title: "Tier 3 — CA Firm's Business Client",
    desc: "HRMS — to manage their own employees, fully isolated from every other client.",
    tagline: "A business served by a CA firm gets its own HR system — and keeps it even if the firm's licence lapses.",
    overview: [
      "A business client is a company on the CA firm's books. When the firm onboards it, the company gets its own login and — if it chooses HRMS — a complete HR workspace of its own, branded with its own name.",
      "Every business client's data is kept separate from every other business client's, even under the same CA firm. If the CA firm's licence lapses, the business client's HRMS access continues uninterrupted, because its data is not the firm's to withhold.",
    ],
    audience: [
      { who: "Business Client Admin", access: "Owner/HR person — runs the company's HRMS or, without HRMS, manages employees and salary structure." },
      { who: "Managers, Finance, IT, Auditor", access: "Company roles inside HRMS with their own dashboards." },
      { who: "Employees", access: "Self-service login for profile, attendance, leave, requests and payslips." },
    ],
    features: [
      {
        heading: "With HRMS",
        points: [
          "The full HRMS — employees, attendance, leave, approvals, payroll, recruitment, assets and reports",
          "Company-branded emails and in-app, email and WhatsApp notifications for employees",
          "Optional owner approval of monthly payroll",
        ],
      },
      {
        heading: "Without HRMS",
        points: [
          "A lightweight client portal: employee list and salary structure",
          "Shareable employee self-onboarding form, protected by a password",
          "Payroll processed by the CA firm through Excel-based payroll",
        ],
      },
      {
        heading: "Isolation & trust",
        points: [
          "Strict data separation between business clients",
          "CA firm staff get read-only oversight only",
          "HRMS stays available even if the CA firm's licence lapses",
        ],
      },
    ],
    highlights: ["Own isolated HRMS", "Company-branded", "Employee self-service", "Uninterrupted access"],
  },
];

export function findLandingItem(kind: "modules" | "platform", slug?: string) {
  const list = kind === "modules" ? MODULES : TIERS;
  return list.find((item) => item.slug === slug) || null;
}
