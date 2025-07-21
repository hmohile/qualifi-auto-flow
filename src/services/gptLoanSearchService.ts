import { UserData } from '@/hooks/useUserData';

export interface LoanOffer {
  lenderName: string;
  apr: number;
  loanTerm: number;
  estimatedMonthlyPayment: number;
  specialBenefits: string[];
}

export interface LoanSearchResponse {
  offers: LoanOffer[];
  creditSegment: string;
  recommendations: string[];
  alternativeSuggestions?: string[];
}

// Credit score segmentation logic
const getCreditSegment = (creditScore: string): { segment: string; aprRange: string } => {
  const score = creditScore.toLowerCase();
  
  if (score.includes('excellent') || score.includes('750')) {
    return { segment: 'Excellent (750+)', aprRange: '5-6%' };
  } else if (score.includes('good') || score.includes('700')) {
    return { segment: 'Good (700-749)', aprRange: '6-8%' };
  } else if (score.includes('fair') || score.includes('640')) {
    return { segment: 'Fair (640-699)', aprRange: '8-12%' };
  } else {
    return { segment: 'Poor (<640)', aprRange: '12%+' };
  }
};

// Calculate loan amount and monthly payment
const calculateLoanDetails = (totalBudget: string, downPayment: string) => {
  const budget = parseFloat(totalBudget.replace(/[^0-9.]/g, ''));
  const down = parseFloat(downPayment.replace(/[^0-9.]/g, ''));
  const loanAmount = budget - down;
  
  return { loanAmount, budget, downPayment: down };
};

// Generate loan offers based on credit segment
const generateLoanOffers = (creditSegment: string, loanAmount: number, carMakeModel: string): LoanOffer[] => {
  const offers: LoanOffer[] = [];
  
  if (creditSegment.includes('Excellent')) {
    offers.push(
      {
        lenderName: 'LightStream (SunTrust)',
        apr: 5.24,
        loanTerm: 60,
        estimatedMonthlyPayment: Math.round((loanAmount * (5.24/100/12)) / (1 - Math.pow(1 + (5.24/100/12), -60))),
        specialBenefits: ['No prepayment penalty', 'Same-day funding', 'Rate discount with autopay']
      },
      {
        lenderName: 'PenFed Credit Union',
        apr: 5.49,
        loanTerm: 48,
        estimatedMonthlyPayment: Math.round((loanAmount * (5.49/100/12)) / (1 - Math.pow(1 + (5.49/100/12), -48))),
        specialBenefits: ['Member benefits', 'Flexible terms', 'Online prequalification']
      },
      {
        lenderName: 'Bank of America Auto Loans',
        apr: 5.79,
        loanTerm: 60,
        estimatedMonthlyPayment: Math.round((loanAmount * (5.79/100/12)) / (1 - Math.pow(1 + (5.79/100/12), -60))),
        specialBenefits: ['Preferred Rewards discount', 'No application fee', 'Fast approval']
      }
    );
  } else if (creditSegment.includes('Good')) {
    offers.push(
      {
        lenderName: 'Chase Auto Loans',
        apr: 6.99,
        loanTerm: 60,
        estimatedMonthlyPayment: Math.round((loanAmount * (6.99/100/12)) / (1 - Math.pow(1 + (6.99/100/12), -60))),
        specialBenefits: ['Chase customer perks', 'Online application', 'Competitive rates']
      },
      {
        lenderName: 'Capital One Auto Finance',
        apr: 7.24,
        loanTerm: 48,
        estimatedMonthlyPayment: Math.round((loanAmount * (7.24/100/12)) / (1 - Math.pow(1 + (7.24/100/12), -48))),
        specialBenefits: ['Pre-qualification available', 'Dealer network', 'No prepayment penalty']
      },
      {
        lenderName: 'Ally Financial',
        apr: 7.49,
        loanTerm: 60,
        estimatedMonthlyPayment: Math.round((loanAmount * (7.49/100/12)) / (1 - Math.pow(1 + (7.49/100/12), -60))),
        specialBenefits: ['Online banking integration', 'Mobile app', 'Rate discount programs']
      }
    );
  } else if (creditSegment.includes('Fair')) {
    offers.push(
      {
        lenderName: 'Capital One Auto Finance',
        apr: 9.99,
        loanTerm: 60,
        estimatedMonthlyPayment: Math.round((loanAmount * (9.99/100/12)) / (1 - Math.pow(1 + (9.99/100/12), -60))),
        specialBenefits: ['Flexible credit requirements', 'Pre-qualification', 'Dealer partnerships']
      },
      {
        lenderName: 'Carvana Financing',
        apr: 10.49,
        loanTerm: 48,
        estimatedMonthlyPayment: Math.round((loanAmount * (10.49/100/12)) / (1 - Math.pow(1 + (10.49/100/12), -48))),
        specialBenefits: ['Online car buying', 'Streamlined process', 'Fair credit accepted']
      },
      {
        lenderName: 'AutoPay Network',
        apr: 11.24,
        loanTerm: 60,
        estimatedMonthlyPayment: Math.round((loanAmount * (11.24/100/12)) / (1 - Math.pow(1 + (11.24/100/12), -60))),
        specialBenefits: ['Multiple lender network', 'Credit improvement programs', 'Flexible terms']
      }
    );
  } else {
    offers.push(
      {
        lenderName: 'SubPrime Auto Lenders Network',
        apr: 15.99,
        loanTerm: 60,
        estimatedMonthlyPayment: Math.round((loanAmount * (15.99/100/12)) / (1 - Math.pow(1 + (15.99/100/12), -60))),
        specialBenefits: ['Bad credit accepted', 'Credit rebuilding opportunity', 'Dealer partnerships']
      },
      {
        lenderName: 'DriveTime Financing',
        apr: 18.24,
        loanTerm: 48,
        estimatedMonthlyPayment: Math.round((loanAmount * (18.24/100/12)) / (1 - Math.pow(1 + (18.24/100/12), -48))),
        specialBenefits: ['No credit check options', 'Buy here pay here', 'Flexible approval']
      }
    );
  }
  
  return offers;
};

// Generate recommendations based on credit segment and loan details
const generateRecommendations = (
  creditSegment: string, 
  loanAmount: number, 
  downPayment: number,
  totalBudget: number,
  offers: LoanOffer[]
): string[] => {
  const recommendations: string[] = [];
  
  if (offers.length > 0) {
    const bestOffer = offers[0];
    recommendations.push(`Best option: ${bestOffer.lenderName} with ${bestOffer.apr}% APR`);
    recommendations.push(`Estimated monthly payment: $${bestOffer.estimatedMonthlyPayment}`);
  }
  
  const downPaymentPercent = (downPayment / totalBudget) * 100;
  if (downPaymentPercent < 20) {
    recommendations.push('Consider increasing your down payment to 20% for better rates');
  }
  
  if (creditSegment.includes('Fair') || creditSegment.includes('Poor')) {
    recommendations.push('Consider improving your credit score before applying for better rates');
    recommendations.push('A co-signer might help you qualify for lower rates');
  }
  
  return recommendations;
};

// Generate alternative suggestions for poor credit or high loan amounts
const generateAlternativeSuggestions = (
  creditSegment: string,
  loanAmount: number,
  totalBudget: number,
  carMakeModel: string
): string[] => {
  const suggestions: string[] = [];
  
  if (creditSegment.includes('Poor') || loanAmount > 50000) {
    suggestions.push('Consider a certified used car instead of new to reduce loan amount');
    suggestions.push('Increase your down payment to reduce monthly payments');
    suggestions.push('Consider a shorter loan term to save on total interest');
    suggestions.push('Look into credit union membership for potentially better rates');
  }
  
  if (loanAmount > 40000) {
    suggestions.push('Consider financing through the car dealership for promotional rates');
  }
  
  return suggestions;
};

export const searchAutoLoans = async (userData: UserData): Promise<LoanSearchResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { carMakeModel, totalBudget, downPayment, creditScore } = userData;
  
  if (!carMakeModel || !totalBudget || !downPayment || !creditScore) {
    throw new Error('Missing required information for loan search');
  }
  
  // Calculate loan details
  const { loanAmount, budget, downPayment: downAmt } = calculateLoanDetails(totalBudget, downPayment);
  
  // Determine credit segment
  const { segment: creditSegment } = getCreditSegment(creditScore);
  
  // Generate loan offers
  const offers = generateLoanOffers(creditSegment, loanAmount, carMakeModel);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    creditSegment, 
    loanAmount, 
    downAmt, 
    budget, 
    offers
  );
  
  // Generate alternative suggestions if needed
  const alternativeSuggestions = generateAlternativeSuggestions(
    creditSegment,
    loanAmount,
    budget,
    carMakeModel
  );
  
  return {
    offers,
    creditSegment,
    recommendations,
    alternativeSuggestions: alternativeSuggestions.length > 0 ? alternativeSuggestions : undefined
  };
};