// Mirrors CA-Backend/utils/loanMath.js — kept in sync for instant client-side
// feedback; the backend recomputes independently when a calculation is saved.
export function calculateEmi({ principal, annualRate, tenureMonths }) {
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  if (!principal || !n) return { emi: 0, totalPayment: 0, totalInterest: 0 };
  if (r === 0) {
    const emi = principal / n;
    return { emi, totalPayment: principal, totalInterest: 0 };
  }
  const factor = Math.pow(1 + r, n);
  const emi = (principal * r * factor) / (factor - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;
  return { emi, totalPayment, totalInterest };
}

export function estimateEligibility({ monthlyIncome, monthlyObligations, annualRate, tenureMonths, foirPercent = 50 }) {
  const disposable = Math.max(0, (monthlyIncome || 0) - (monthlyObligations || 0));
  const maxEmi = disposable * (foirPercent / 100);
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  let maxEligibleAmount;
  if (!n) {
    maxEligibleAmount = 0;
  } else if (r === 0) {
    maxEligibleAmount = maxEmi * n;
  } else {
    const factor = Math.pow(1 + r, n);
    maxEligibleAmount = (maxEmi * (factor - 1)) / (r * factor);
  }
  return { maxEmi, maxEligibleAmount };
}

export function buildAmortizationSchedule({ principal, annualRate, tenureMonths }) {
  const r = annualRate / 12 / 100;
  const { emi } = calculateEmi({ principal, annualRate, tenureMonths });
  let balance = principal;
  const rows = [];
  for (let month = 1; month <= tenureMonths && balance > 0.01; month++) {
    const interest = balance * r;
    const principalPaid = Math.min(emi - interest, balance);
    balance -= principalPaid;
    rows.push({ month, interest, principalPaid, balance: Math.max(balance, 0) });
  }
  return rows;
}
