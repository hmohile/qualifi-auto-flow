
export interface LenderProduct {
  id: string;
  name: string;
  logo?: string;
  minLoanAmount: number;
  maxLoanAmount: number;
  minCreditScore: number;
  minMonthlyIncome: number;
  acceptedEmploymentTypes: string[];
  loanTermsMonths: number[];
  aprRange: {
    min: number;
    max: number;
    goodCredit: number; // APR for credit score 700+
    fairCredit: number; // APR for credit score 600-699
    poorCredit: number; // APR for credit score below 600
  };
  maxLTV: number; // Maximum loan-to-value ratio (as decimal, e.g., 0.9 for 90%)
  statesServed?: string[];
  specialPrograms: string[];
  isActive: boolean;
}

export const lenderData: LenderProduct[] = [
  {
    id: "chase-auto",
    name: "Chase Auto Finance",
    logo: "/logos/chase.png",
    minLoanAmount: 5000,
    maxLoanAmount: 100000,
    minCreditScore: 650,
    minMonthlyIncome: 3000,
    acceptedEmploymentTypes: ["Full-time", "Part-time", "Self-employed"],
    loanTermsMonths: [36, 48, 60, 72],
    aprRange: {
      min: 3.99,
      max: 18.99,
      goodCredit: 4.5,
      fairCredit: 8.9,
      poorCredit: 15.9
    },
    maxLTV: 0.90,
    specialPrograms: ["First-time buyer", "Refinance"],
    isActive: true
  },
  {
    id: "capital-one",
    name: "Capital One Auto Finance",
    logo: "/logos/capitalone.png",
    minLoanAmount: 4000,
    maxLoanAmount: 75000,
    minCreditScore: 600,
    minMonthlyIncome: 2500,
    acceptedEmploymentTypes: ["Full-time", "Part-time"],
    loanTermsMonths: [36, 48, 60, 72, 84],
    aprRange: {
      min: 4.24,
      max: 19.99,
      goodCredit: 5.2,
      fairCredit: 10.5,
      poorCredit: 17.8
    },
    maxLTV: 0.85,
    specialPrograms: ["Used car specialists"],
    isActive: true
  },
  {
    id: "wells-fargo",
    name: "Wells Fargo Auto",
    logo: "/logos/wellsfargo.png",
    minLoanAmount: 5000,
    maxLoanAmount: 150000,
    minCreditScore: 680,
    minMonthlyIncome: 3500,
    acceptedEmploymentTypes: ["Full-time", "Self-employed"],
    loanTermsMonths: [24, 36, 48, 60, 72],
    aprRange: {
      min: 3.74,
      max: 16.99,
      goodCredit: 4.1,
      fairCredit: 7.9,
      poorCredit: 14.5
    },
    maxLTV: 0.95,
    specialPrograms: ["Green vehicle discount", "Refinance"],
    isActive: true
  },
  {
    id: "credit-union-one",
    name: "Local Credit Union",
    logo: "/logos/creditunion.png",
    minLoanAmount: 3000,
    maxLoanAmount: 80000,
    minCreditScore: 580,
    minMonthlyIncome: 2000,
    acceptedEmploymentTypes: ["Full-time", "Part-time", "Self-employed", "Retired"],
    loanTermsMonths: [36, 48, 60, 72],
    aprRange: {
      min: 3.25,
      max: 15.99,
      goodCredit: 3.8,
      fairCredit: 6.9,
      poorCredit: 12.9
    },
    maxLTV: 0.90,
    specialPrograms: ["Member benefits", "First-time buyer"],
    isActive: true
  },
  {
    id: "ally-bank",
    name: "Ally Bank Auto",
    logo: "/logos/ally.png",
    minLoanAmount: 5000,
    maxLoanAmount: 100000,
    minCreditScore: 620,
    minMonthlyIncome: 2800,
    acceptedEmploymentTypes: ["Full-time", "Part-time"],
    loanTermsMonths: [36, 48, 60, 72, 84],
    aprRange: {
      min: 4.49,
      max: 19.49,
      goodCredit: 5.1,
      fairCredit: 9.8,
      poorCredit: 16.9
    },
    maxLTV: 0.85,
    specialPrograms: ["Online-only rates"],
    isActive: true
  },
  {
    id: "bank-of-america",
    name: "Bank of America Auto",
    logo: "/logos/boa.png",
    minLoanAmount: 7500,
    maxLoanAmount: 125000,
    minCreditScore: 660,
    minMonthlyIncome: 3200,
    acceptedEmploymentTypes: ["Full-time", "Self-employed"],
    loanTermsMonths: [36, 48, 60, 72],
    aprRange: {
      min: 4.19,
      max: 17.99,
      goodCredit: 4.7,
      fairCredit: 8.5,
      poorCredit: 15.2
    },
    maxLTV: 0.88,
    specialPrograms: ["Preferred Rewards discount"],
    isActive: true
  },
  {
    id: "lightstream",
    name: "LightStream Auto",
    logo: "/logos/lightstream.png",
    minLoanAmount: 5000,
    maxLoanAmount: 100000,
    minCreditScore: 720,
    minMonthlyIncome: 4000,
    acceptedEmploymentTypes: ["Full-time"],
    loanTermsMonths: [24, 36, 48, 60, 72, 84],
    aprRange: {
      min: 3.99,
      max: 12.99,
      goodCredit: 4.2,
      fairCredit: 6.8,
      poorCredit: 10.9
    },
    maxLTV: 0.95,
    specialPrograms: ["Excellent credit rates", "No fees"],
    isActive: true
  }
];
