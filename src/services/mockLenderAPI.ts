
import { LenderProduct } from '@/data/lenders';

export interface LenderQuoteRequest {
  borrowerProfile: {
    monthlyIncome: number;
    estimatedCreditScore: number;
    employmentType: string;
    loanAmount: number;
    vehicleValue: number;
    downPayment: number;
  };
  lenderId: string;
}

export interface LenderQuote {
  lenderId: string;
  lenderName: string;
  offeredAPR: number;
  termLength: number;
  maxLoanAmount: number;
  monthlyPayment: number;
  fees: {
    processing: number;
    prepaymentPenalty: number;
    documentation: number;
  };
  expirationTime: Date;
  status: 'pending' | 'received' | 'negotiated' | 'expired';
  negotiationHistory?: NegotiationAttempt[];
  confidence: 'high' | 'medium' | 'low';
}

export interface NegotiationAttempt {
  id: string;
  timestamp: Date;
  type: 'rate_challenge' | 'term_request' | 'fee_reduction';
  message: string;
  response: 'accepted' | 'declined' | 'counter_offer';
  originalAPR?: number;
  newAPR?: number;
  improvementAmount?: number;
}

// Simulate network delay and realistic response times
const simulateDelay = (min: number = 2000, max: number = 8000): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Mock lender response logic based on borrower profile
const generateMockQuote = (request: LenderQuoteRequest, lender: LenderProduct): LenderQuote => {
  const { borrowerProfile } = request;
  
  // Calculate base APR based on credit score and lender's range
  let baseAPR: number;
  if (borrowerProfile.estimatedCreditScore >= 740) {
    baseAPR = lender.aprRange.goodCredit;
  } else if (borrowerProfile.estimatedCreditScore >= 670) {
    baseAPR = lender.aprRange.goodCredit + 0.5;
  } else if (borrowerProfile.estimatedCreditScore >= 600) {
    baseAPR = lender.aprRange.fairCredit;
  } else {
    baseAPR = lender.aprRange.poorCredit;
  }

  // Add some randomness to make it realistic (±0.5%)
  const randomVariation = (Math.random() - 0.5) * 1.0;
  const finalAPR = Math.max(lender.aprRange.min, Math.min(lender.aprRange.max, baseAPR + randomVariation));

  // Calculate monthly payment
  const monthlyRate = finalAPR / 100 / 12;
  const termMonths = lender.loanTermsMonths.includes(60) ? 60 : lender.loanTermsMonths[0];
  const monthlyPayment = borrowerProfile.loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  // Generate fees
  const fees = {
    processing: Math.floor(Math.random() * 500) + 200, // $200-$700
    prepaymentPenalty: Math.random() > 0.7 ? Math.floor(Math.random() * 1000) + 500 : 0,
    documentation: Math.floor(Math.random() * 200) + 50 // $50-$250
  };

  // Determine confidence based on how well borrower matches lender criteria
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  const creditBuffer = borrowerProfile.estimatedCreditScore - lender.minCreditScore;
  const incomeRatio = borrowerProfile.monthlyIncome / lender.minMonthlyIncome;
  
  if (creditBuffer >= 70 && incomeRatio >= 1.8) {
    confidence = 'high';
  } else if (creditBuffer < 30 || incomeRatio < 1.2) {
    confidence = 'low';
  }

  return {
    lenderId: lender.id,
    lenderName: lender.name,
    offeredAPR: Math.round(finalAPR * 100) / 100,
    termLength: termMonths,
    maxLoanAmount: Math.min(lender.maxLoanAmount, borrowerProfile.loanAmount * 1.2),
    monthlyPayment: Math.round(monthlyPayment),
    fees,
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'received',
    confidence
  };
};

// Mock API endpoint for requesting quotes
export const requestLenderQuote = async (request: LenderQuoteRequest, lender: LenderProduct): Promise<LenderQuote> => {
  console.log(`Requesting quote from ${lender.name}...`);
  
  // Simulate network delay
  await simulateDelay();
  
  // Generate mock quote
  const quote = generateMockQuote(request, lender);
  
  console.log(`Quote received from ${lender.name}:`, quote);
  return quote;
};

// Simulate negotiation with a lender
export const negotiateWithLender = async (
  quote: LenderQuote, 
  competitorAPR: number, 
  negotiationType: 'rate_challenge' | 'term_request' | 'fee_reduction'
): Promise<LenderQuote> => {
  console.log(`Negotiating with ${quote.lenderName} - ${negotiationType}`);
  
  // Simulate negotiation delay
  await simulateDelay(1000, 3000);
  
  const negotiationAttempt: NegotiationAttempt = {
    id: Date.now().toString(),
    timestamp: new Date(),
    type: negotiationType,
    message: '',
    response: 'declined',
    originalAPR: quote.offeredAPR
  };

  // Negotiation logic based on type and competitive landscape
  let success = false;
  let improvement = 0;

  switch (negotiationType) {
    case 'rate_challenge':
      const rateDifference = quote.offeredAPR - competitorAPR;
      negotiationAttempt.message = `Competitor is offering ${competitorAPR}% - can you match or beat this rate?`;
      
      // Success probability based on rate difference and lender flexibility
      const successProbability = Math.min(0.8, rateDifference * 0.3);
      success = Math.random() < successProbability;
      
      if (success) {
        improvement = Math.min(rateDifference * 0.7, 1.5); // Improve by up to 70% of difference, max 1.5%
        negotiationAttempt.response = 'accepted';
      }
      break;
      
    case 'fee_reduction':
      negotiationAttempt.message = 'Can you waive or reduce processing fees for this qualified borrower?';
      success = Math.random() < 0.4; // 40% success rate for fee reduction
      break;
      
    case 'term_request':
      negotiationAttempt.message = 'Can you offer more flexible term options?';
      success = Math.random() < 0.3; // 30% success rate for term changes
      break;
  }

  if (success && negotiationType === 'rate_challenge') {
    const newAPR = Math.max(quote.offeredAPR - improvement, quote.offeredAPR * 0.8); // Don't go below 80% of original
    negotiationAttempt.newAPR = Math.round(newAPR * 100) / 100;
    negotiationAttempt.improvementAmount = improvement;
    
    // Recalculate monthly payment
    const monthlyRate = newAPR / 100 / 12;
    const newMonthlyPayment = quote.maxLoanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, quote.termLength)) / 
      (Math.pow(1 + monthlyRate, quote.termLength) - 1);

    const updatedQuote: LenderQuote = {
      ...quote,
      offeredAPR: negotiationAttempt.newAPR,
      monthlyPayment: Math.round(newMonthlyPayment),
      status: 'negotiated',
      negotiationHistory: [...(quote.negotiationHistory || []), negotiationAttempt]
    };
    
    console.log(`Negotiation successful! ${quote.lenderName} improved rate to ${negotiationAttempt.newAPR}%`);
    return updatedQuote;
  } else {
    negotiationAttempt.response = 'declined';
    const updatedQuote: LenderQuote = {
      ...quote,
      negotiationHistory: [...(quote.negotiationHistory || []), negotiationAttempt]
    };
    
    console.log(`Negotiation declined by ${quote.lenderName}`);
    return updatedQuote;
  }
};
