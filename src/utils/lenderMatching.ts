
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
  return parseInt(value.replace(/[$,]/g, '')) || 0;
};

const estimateCreditScore = (profile: BorrowerProfile): number => {
  // Simple credit score estimation based on available data
  let baseScore = 650; // Average starting point
  
  const monthlyIncome = parseMoneyString(profile.monthlyIncome);
  const accountBalance = parseMoneyString(profile.accountBalance);
  
  // Income factor
  if (monthlyIncome >= 6000) baseScore += 50;
  else if (monthlyIncome >= 4000) baseScore += 25;
  else if (monthlyIncome < 2500) baseScore -= 25;
  
  // Account balance factor (indicates financial stability)
  if (accountBalance >= 20000) baseScore += 30;
  else if (accountBalance >= 10000) baseScore += 15;
  else if (accountBalance < 2000) baseScore -= 20;
  
  // Employment type factor
  if (profile.employmentType === 'Full-time') baseScore += 15;
  else if (profile.employmentType === 'Self-employed') baseScore -= 10;
  
  return Math.max(300, Math.min(850, baseScore));
};

const calculateMonthlyPayment = (loanAmount: number, apr: number, termMonths: number): number => {
  const monthlyRate = apr / 100 / 12;
  const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment);
};

const selectAPRForCreditScore = (lender: LenderProduct, creditScore: number): number => {
  if (creditScore >= 720) return lender.aprRange.goodCredit;
  if (creditScore >= 600) return lender.aprRange.fairCredit;
  return lender.aprRange.poorCredit;
};

export const matchBorrowerToLenders = (profile: BorrowerProfile): MatchResult => {
  console.log('Matching borrower profile:', profile);
  
  const monthlyIncome = parseMoneyString(profile.monthlyIncome);
  const downPayment = parseMoneyString(profile.downPayment);
  const tradeInValue = parseMoneyString(profile.tradeInValue);
  const estimatedCreditScore = profile.estimatedCreditScore || estimateCreditScore(profile);
  
  // Determine vehicle value
  let vehicleValue = parseMoneyString(profile.purchasePrice);
  if (!vehicleValue && profile.vinOrModel) {
    const vehicleInfo = parseVehicleInfo(profile.vinOrModel);
    const valueEstimate = estimateVehicleValue(vehicleInfo);
    vehicleValue = valueEstimate?.finalEstimate || 25000;
  }
  if (!vehicleValue) vehicleValue = 25000; // Default fallback
  
  const totalDownPayment = downPayment + tradeInValue;
  const loanAmount = vehicleValue - totalDownPayment;
  
  const borrowerSummary = {
    monthlyIncome,
    loanAmount,
    vehicleValue,
    downPayment: totalDownPayment,
    estimatedCreditScore
  };
  
  console.log('Borrower summary:', borrowerSummary);
  
  const matches: LenderMatch[] = [];
  const noMatchReasons: string[] = [];
  
  for (const lender of lenderData.filter(l => l.isActive)) {
    console.log(`Checking lender: ${lender.name}`);
    
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
      reasons.push(`Monthly income $${monthlyIncome} below minimum $${lender.minMonthlyIncome}`);
    }
    
    // Loan amount check
    if (loanAmount < lender.minLoanAmount || loanAmount > lender.maxLoanAmount) {
      eligible = false;
      reasons.push(`Loan amount $${loanAmount} outside range $${lender.minLoanAmount}-$${lender.maxLoanAmount}`);
    }
    
    // Employment type check
    if (profile.employmentType && !lender.acceptedEmploymentTypes.includes(profile.employmentType)) {
      eligible = false;
      reasons.push(`Employment type '${profile.employmentType}' not accepted`);
    }
    
    // LTV check
    const ltv = loanAmount / vehicleValue;
    if (ltv > lender.maxLTV) {
      eligible = false;
      reasons.push(`LTV ratio ${(ltv * 100).toFixed(1)}% exceeds maximum ${(lender.maxLTV * 100).toFixed(1)}%`);
    }
    
    if (eligible) {
      const estimatedAPR = selectAPRForCreditScore(lender, estimatedCreditScore);
      const preferredTerm = lender.loanTermsMonths.includes(60) ? 60 : lender.loanTermsMonths[0];
      const monthlyPayment = calculateMonthlyPayment(loanAmount, estimatedAPR, preferredTerm);
      
      // Determine confidence based on how well they fit
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (estimatedCreditScore >= lender.minCreditScore + 50 && 
          monthlyIncome >= lender.minMonthlyIncome * 1.5) {
        confidence = 'high';
      } else if (estimatedCreditScore <= lender.minCreditScore + 20) {
        confidence = 'low';
      }
      
      matches.push({
        lender,
        estimatedAPR,
        monthlyPayment,
        loanAmount,
        loanTerm: preferredTerm,
        confidence,
        reasons: [`Qualified with ${confidence} confidence`]
      });
      
      console.log(`✓ Matched with ${lender.name}: APR ${estimatedAPR}%, Payment $${monthlyPayment}/mo`);
    } else {
      console.log(`✗ Not matched with ${lender.name}:`, reasons);
      noMatchReasons.push(`${lender.name}: ${reasons.join(', ')}`);
    }
  }
  
  // Sort matches by APR (best rates first)
  matches.sort((a, b) => a.estimatedAPR - b.estimatedAPR);
  
  console.log(`Found ${matches.length} matches for borrower`);
  
  return {
    matches,
    noMatchReasons,
    borrowerSummary
  };
};
