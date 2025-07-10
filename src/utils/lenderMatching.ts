
import { LenderProduct, lenderData } from '@/data/lenders';
import { parseVehicleInfo, estimateVehicleValue } from './vehiclePricing';

interface BorrowerProfile {
  fullName?: string;
  email?: string;
  monthlyIncome?: string;
  employmentType?: string;
  employerName?: string;
  dateOfBirth?: string;
  vehicleType?: string;
  vinOrModel?: string;
  purchasePrice?: string;
  downPayment?: string;
  tradeInValue?: string;
  accountBalance?: string;
  estimatedCreditScore?: number;
}

interface LenderMatch {
  lender: LenderProduct;
  estimatedAPR: number;
  monthlyPayment: number;
  loanAmount: number;
  loanTerm: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface MatchResult {
  matches: LenderMatch[];
  noMatchReasons: string[];
  borrowerSummary: {
    monthlyIncome: number;
    loanAmount: number;
    vehicleValue: number;
    downPayment: number;
    estimatedCreditScore: number;
  };
}

const parseMoneyString = (value?: string): number => {
  if (!value) return 0;
  // Handle normalized values like '$0' for no trade-in
  if (value === '$0') return 0;
  return parseInt(value.replace(/[$,]/g, '')) || 0;
};

const normalizeEmploymentType = (employmentType?: string): string => {
  if (!employmentType) return '';
  
  const normalized = employmentType.toLowerCase().trim();
  if (normalized.includes('full') && normalized.includes('time')) return 'Full-time';
  if (normalized.includes('part') && normalized.includes('time')) return 'Part-time';
  if (normalized.includes('self') || normalized.includes('freelance')) return 'Self-employed';
  if (normalized.includes('retire')) return 'Retired';
  
  return employmentType;
};

const estimateCreditScore = (profile: BorrowerProfile): number => {
  console.log('Estimating credit score for profile:', profile);
  
  // Enhanced credit score estimation
  let baseScore = 650; // Average starting point
  
  const monthlyIncome = parseMoneyString(profile.monthlyIncome);
  const accountBalance = parseMoneyString(profile.accountBalance);
  
  console.log('Parsed income:', monthlyIncome, 'balance:', accountBalance);
  
  // Income factor (stronger weighting)
  if (monthlyIncome >= 8000) baseScore += 60;
  else if (monthlyIncome >= 6000) baseScore += 40;
  else if (monthlyIncome >= 4500) baseScore += 25;
  else if (monthlyIncome >= 3000) baseScore += 10;
  else if (monthlyIncome < 2500) baseScore -= 30;
  
  // Account balance factor (indicates financial stability)
  if (accountBalance >= 30000) baseScore += 40;
  else if (accountBalance >= 20000) baseScore += 30;
  else if (accountBalance >= 10000) baseScore += 20;
  else if (accountBalance >= 5000) baseScore += 10;
  else if (accountBalance < 2000) baseScore -= 25;
  
  // Employment type factor
  const normalizedEmployment = normalizeEmploymentType(profile.employmentType);
  if (normalizedEmployment === 'Full-time') baseScore += 20;
  else if (normalizedEmployment === 'Part-time') baseScore -= 5;
  else if (normalizedEmployment === 'Self-employed') baseScore -= 15;
  else if (normalizedEmployment === 'Retired') baseScore += 10;
  
  // Income stability (higher income = better score)
  const incomeToBalanceRatio = accountBalance / (monthlyIncome * 12);
  if (incomeToBalanceRatio > 0.5) baseScore += 15; // Good savings rate
  else if (incomeToBalanceRatio < 0.1) baseScore -= 10; // Low savings
  
  const finalScore = Math.max(300, Math.min(850, baseScore));
  console.log('Estimated credit score:', finalScore);
  
  return finalScore;
};

const calculateMonthlyPayment = (loanAmount: number, apr: number, termMonths: number): number => {
  if (loanAmount <= 0 || apr <= 0) return 0;
  
  const monthlyRate = apr / 100 / 12;
  const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment);
};

const selectAPRForCreditScore = (lender: LenderProduct, creditScore: number): number => {
  if (creditScore >= 740) return lender.aprRange.goodCredit;
  if (creditScore >= 670) return lender.aprRange.goodCredit + 1;
  if (creditScore >= 600) return lender.aprRange.fairCredit;
  return lender.aprRange.poorCredit;
};

export const matchBorrowerToLenders = (profile: BorrowerProfile): MatchResult => {
  console.log('Starting lender matching for profile:', profile);
  
  const monthlyIncome = parseMoneyString(profile.monthlyIncome);
  const downPayment = parseMoneyString(profile.downPayment);
  const tradeInValue = parseMoneyString(profile.tradeInValue);
  const estimatedCreditScore = profile.estimatedCreditScore || estimateCreditScore(profile);
  
  console.log('Parsed financial data:', {
    monthlyIncome,
    downPayment,
    tradeInValue,
    estimatedCreditScore
  });
  
  // Determine vehicle value with better logic
  let vehicleValue = parseMoneyString(profile.purchasePrice);
  if (!vehicleValue && profile.vinOrModel) {
    const vehicleInfo = parseVehicleInfo(profile.vinOrModel);
    const valueEstimate = estimateVehicleValue(vehicleInfo);
    vehicleValue = valueEstimate?.finalEstimate || 25000;
    console.log('Estimated vehicle value from VIN/model:', vehicleValue);
  }
  if (!vehicleValue) vehicleValue = 25000; // Default fallback
  
  const totalDownPayment = downPayment + tradeInValue;
  const loanAmount = Math.max(0, vehicleValue - totalDownPayment);
  
  const borrowerSummary = {
    monthlyIncome,
    loanAmount,
    vehicleValue,
    downPayment: totalDownPayment,
    estimatedCreditScore
  };
  
  console.log('Borrower summary for matching:', borrowerSummary);
  
  const matches: LenderMatch[] = [];
  const noMatchReasons: string[] = [];
  
  // Normalize employment type for matching
  const normalizedEmployment = normalizeEmploymentType(profile.employmentType);
  
  for (const lender of lenderData.filter(l => l.isActive)) {
    console.log(`\nEvaluating lender: ${lender.name}`);
    
    const reasons: string[] = [];
    let eligible = true;
    
    // Credit score check
    if (estimatedCreditScore < lender.minCreditScore) {
      eligible = false;
      reasons.push(`Credit score ${estimatedCreditScore} below minimum ${lender.minCreditScore}`);
    }
    
    // Income check
    if (monthlyIncome < lender.minMonthlyIncome) {
      eligible = false;
      reasons.push(`Monthly income $${monthlyIncome.toLocaleString()} below minimum $${lender.minMonthlyIncome.toLocaleString()}`);
    }
    
    // Loan amount check
    if (loanAmount < lender.minLoanAmount || loanAmount > lender.maxLoanAmount) {
      eligible = false;
      reasons.push(`Loan amount $${loanAmount.toLocaleString()} outside range $${lender.minLoanAmount.toLocaleString()}-$${lender.maxLoanAmount.toLocaleString()}`);
    }
    
    // Employment type check (more flexible matching)
    if (normalizedEmployment && !lender.acceptedEmploymentTypes.includes(normalizedEmployment)) {
      eligible = false;
      reasons.push(`Employment type '${normalizedEmployment}' not accepted by this lender`);
    }
    
    // LTV check
    const ltv = vehicleValue > 0 ? loanAmount / vehicleValue : 0;
    if (ltv > lender.maxLTV) {
      eligible = false;
      reasons.push(`LTV ratio ${(ltv * 100).toFixed(1)}% exceeds maximum ${(lender.maxLTV * 100).toFixed(1)}%`);
    }
    
    console.log(`Lender ${lender.name} eligibility:`, { eligible, reasons });
    
    if (eligible) {
      const estimatedAPR = selectAPRForCreditScore(lender, estimatedCreditScore);
      const preferredTerm = lender.loanTermsMonths.includes(60) ? 60 : lender.loanTermsMonths[0];
      const monthlyPayment = calculateMonthlyPayment(loanAmount, estimatedAPR, preferredTerm);
      
      // Enhanced confidence calculation
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      const creditBuffer = estimatedCreditScore - lender.minCreditScore;
      const incomeBuffer = monthlyIncome / lender.minMonthlyIncome;
      
      if (creditBuffer >= 70 && incomeBuffer >= 1.8) {
        confidence = 'high';
      } else if (creditBuffer >= 40 && incomeBuffer >= 1.4) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }
      
      matches.push({
        lender,
        estimatedAPR,
        monthlyPayment,
        loanAmount,
        loanTerm: preferredTerm,
        confidence,
        reasons: [`Qualified with ${confidence} confidence (Credit: ${estimatedCreditScore}, Income: $${monthlyIncome.toLocaleString()}/mo)`]
      });
      
      console.log(`✅ Matched with ${lender.name}: APR ${estimatedAPR}%, Payment $${monthlyPayment}/mo, Confidence: ${confidence}`);
    } else {
      console.log(`❌ Not matched with ${lender.name}:`, reasons);
      noMatchReasons.push(`${lender.name}: ${reasons[0]}`); // Show only first reason to keep it clean
    }
  }
  
  // Sort matches by APR (best rates first), then by confidence
  matches.sort((a, b) => {
    if (a.estimatedAPR !== b.estimatedAPR) {
      return a.estimatedAPR - b.estimatedAPR;
    }
    // If APR is same, prefer higher confidence
    const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
  
  console.log(`\nFinal result: Found ${matches.length} matches for borrower`);
  
  return {
    matches,
    noMatchReasons,
    borrowerSummary
  };
};
