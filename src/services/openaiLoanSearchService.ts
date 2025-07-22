interface LoanOffer {
  lenderName: string;
  apr: number;
  loanTerm: number;
  monthlyPayment: number;
  specialBenefits: string[];
}

interface LoanSearchResult {
  offers: LoanOffer[];
  creditSegment: string;
  recommendations: string[];
  canApplyDirectly: boolean;
}

interface UserLoanData {
  carMakeModel: string;
  totalBudget: string;
  downPayment: string;
  annualIncome: string;
  creditScore: string;
}

// Credit score segmentation
const getCreditSegment = (creditScore: string): { segment: string; aprRange: string } => {
  const score = creditScore.toLowerCase();
  
  if (score.includes('excellent') || (parseInt(creditScore) >= 750)) {
    return { segment: 'Excellent (750+)', aprRange: '5-6%' };
  } else if (score.includes('good') || (parseInt(creditScore) >= 700)) {
    return { segment: 'Good (700-749)', aprRange: '6-8%' };
  } else if (score.includes('fair') || (parseInt(creditScore) >= 640)) {
    return { segment: 'Fair (640-699)', aprRange: '8-12%' };
  } else {
    return { segment: 'Poor (<640)', aprRange: '12%+' };
  }
};

// Generate loan offers based on credit segment
const generateLoanOffers = (userData: UserLoanData): LoanOffer[] => {
  const { segment, aprRange } = getCreditSegment(userData.creditScore);
  const budget = parseFloat(userData.totalBudget.replace(/[$,]/g, ''));
  const downPayment = parseFloat(userData.downPayment.replace(/[$,]/g, ''));
  const loanAmount = budget - downPayment;

  let baseApr: number;
  let offers: LoanOffer[] = [];

  // Set base APR based on credit segment
  if (segment.includes('Excellent')) {
    baseApr = 5.5;
    offers = [
      {
        lenderName: 'LightStream (SunTrust)',
        apr: 5.24,
        loanTerm: 60,
        monthlyPayment: Math.round((loanAmount * (0.0524/12)) / (1 - Math.pow(1 + 0.0524/12, -60))),
        specialBenefits: ['No fees', 'Rate discount for autopay', 'Same-day funding']
      },
      {
        lenderName: 'PenFed Credit Union',
        apr: 5.49,
        loanTerm: 72,
        monthlyPayment: Math.round((loanAmount * (0.0549/12)) / (1 - Math.pow(1 + 0.0549/12, -72))),
        specialBenefits: ['Member benefits', 'No prepayment penalty', 'Online application']
      },
      {
        lenderName: 'Bank of America',
        apr: 5.79,
        loanTerm: 60,
        monthlyPayment: Math.round((loanAmount * (0.0579/12)) / (1 - Math.pow(1 + 0.0579/12, -60))),
        specialBenefits: ['Preferred Rewards discount', 'Digital application', 'Quick approval']
      }
    ];
  } else if (segment.includes('Good')) {
    baseApr = 7.0;
    offers = [
      {
        lenderName: 'Chase Auto Loans',
        apr: 6.89,
        loanTerm: 60,
        monthlyPayment: Math.round((loanAmount * (0.0689/12)) / (1 - Math.pow(1 + 0.0689/12, -60))),
        specialBenefits: ['Relationship pricing', 'Online pre-qualification', 'No application fee']
      },
      {
        lenderName: 'Capital One Auto Finance',
        apr: 7.24,
        loanTerm: 72,
        monthlyPayment: Math.round((loanAmount * (0.0724/12)) / (1 - Math.pow(1 + 0.0724/12, -72))),
        specialBenefits: ['Pre-qualification available', 'Dealer network', 'Mobile app']
      },
      {
        lenderName: 'Ally Financial',
        apr: 7.49,
        loanTerm: 60,
        monthlyPayment: Math.round((loanAmount * (0.0749/12)) / (1 - Math.pow(1 + 0.0749/12, -60))),
        specialBenefits: ['Online account management', 'No prepayment penalty', 'Rate match guarantee']
      }
    ];
  } else if (segment.includes('Fair')) {
    baseApr = 10.0;
    offers = [
      {
        lenderName: 'Capital One Auto Finance',
        apr: 9.74,
        loanTerm: 60,
        monthlyPayment: Math.round((loanAmount * (0.0974/12)) / (1 - Math.pow(1 + 0.0974/12, -60))),
        specialBenefits: ['Pre-qualification with soft credit check', 'Large dealer network']
      },
      {
        lenderName: 'Carvana Financing',
        apr: 10.49,
        loanTerm: 72,
        monthlyPayment: Math.round((loanAmount * (0.1049/12)) / (1 - Math.pow(1 + 0.1049/12, -72))),
        specialBenefits: ['Online car buying', 'Quick approval', '7-day return policy']
      },
      {
        lenderName: 'AutoPay (Aggregator)',
        apr: 11.24,
        loanTerm: 60,
        monthlyPayment: Math.round((loanAmount * (0.1124/12)) / (1 - Math.pow(1 + 0.1124/12, -60))),
        specialBenefits: ['Multiple lender comparison', 'Soft credit check', 'Quick online process']
      }
    ];
  } else {
    // Poor credit
    baseApr = 15.0;
    offers = [
      {
        lenderName: 'Credit Acceptance Corporation',
        apr: 14.99,
        loanTerm: 72,
        monthlyPayment: Math.round((loanAmount * (0.1499/12)) / (1 - Math.pow(1 + 0.1499/12, -72))),
        specialBenefits: ['Subprime specialist', 'Dealer network', 'Credit building opportunity']
      },
      {
        lenderName: 'Santander Consumer USA',
        apr: 16.49,
        loanTerm: 60,
        monthlyPayment: Math.round((loanAmount * (0.1649/12)) / (1 - Math.pow(1 + 0.1649/12, -60))),
        specialBenefits: ['Bad credit accepted', 'Quick decisions', 'Online account access']
      }
    ];
  }

  return offers;
};

// Generate recommendations based on user data
const generateRecommendations = (userData: UserLoanData): string[] => {
  const { segment } = getCreditSegment(userData.creditScore);
  const budget = parseFloat(userData.totalBudget.replace(/[$,]/g, ''));
  const downPayment = parseFloat(userData.downPayment.replace(/[$,]/g, ''));
  const annualIncome = parseFloat(userData.annualIncome.replace(/[$,]/g, ''));
  const monthlyIncome = annualIncome / 12;
  const loanAmount = budget - downPayment;
  
  const recommendations: string[] = [];
  
  // Payment-to-income ratio check
  const estimatedPayment = (loanAmount * 0.02); // Rough estimate
  if ((estimatedPayment / monthlyIncome) > 0.15) {
    recommendations.push('Consider increasing your down payment to reduce monthly payments');
    recommendations.push('Look into certified used cars to lower the total cost');
  }
  
  // Credit-specific recommendations
  if (segment.includes('Poor')) {
    recommendations.push('Consider using a co-signer to get better rates');
    recommendations.push('Work on improving your credit score before applying');
    recommendations.push('Shop around with multiple subprime lenders');
  } else if (segment.includes('Fair')) {
    recommendations.push('Consider pre-qualification to see rates without affecting credit');
    recommendations.push('Shop for rates within a 14-45 day window to minimize credit impact');
  }
  
  // Down payment recommendations
  if ((downPayment / budget) < 0.1) {
    recommendations.push('Consider a larger down payment (10-20%) to get better rates');
  }
  
  return recommendations;
};

export const searchAutoLoans = async (userData: UserLoanData): Promise<LoanSearchResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { segment } = getCreditSegment(userData.creditScore);
  const offers = generateLoanOffers(userData);
  const recommendations = generateRecommendations(userData);
  
  return {
    offers,
    creditSegment: segment,
    recommendations,
    canApplyDirectly: true
  };
};

// OpenAI integration for enhanced search (placeholder for future implementation)
export const searchAutoLoansWithOpenAI = async (userData: UserLoanData): Promise<LoanSearchResult> => {
  // For now, use the mock data but this can be enhanced with actual OpenAI API calls
  // to get real-time rates and more personalized recommendations
  
  console.log('Searching for auto loans with AI enhancement for:', userData);
  
  // In the future, this would make an actual OpenAI API call like:
  // const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [
  //       {
  //         role: 'system',
  //         content: 'You are an expert auto loan advisor. Provide personalized loan recommendations.'
  //       },
  //       {
  //         role: 'user',
  //         content: `Find the best auto loan options for: ${JSON.stringify(userData)}`
  //       }
  //     ]
  //   })
  // });
  
  return searchAutoLoans(userData);
};