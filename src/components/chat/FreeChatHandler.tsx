
import { useUserData } from '@/hooks/useUserData';

export const useFreeChatHandler = () => {
  const { userData } = useUserData();

  const parseMoneyString = (value?: string): number => {
    if (!value) return 0;
    if (value === '$0') return 0;
    return parseInt(value.replace(/[$,]/g, '')) || 0;
  };

  const calculateMonthlyPayment = (loanAmount: number, apr: number, termMonths: number): number => {
    if (loanAmount <= 0 || apr <= 0) return 0;
    const monthlyRate = apr / 100 / 12;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                    (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(payment);
  };

  const handleFreeChatQuestion = async (question: string): Promise<string> => {
    const lowerQ = question.toLowerCase();
    
    // Parse user financial data for context
    const monthlyIncome = parseMoneyString(userData.monthlyIncome);
    const vehiclePrice = parseMoneyString(userData.purchasePrice);
    const downPayment = parseMoneyString(userData.downPayment);
    const tradeInValue = parseMoneyString(userData.tradeInValue);
    const accountBalance = parseMoneyString(userData.accountBalance);
    const loanAmount = vehiclePrice - downPayment - tradeInValue;
    
    // Estimate monthly payment (assuming 6% APR, 60 months)
    const estimatedPayment = calculateMonthlyPayment(loanAmount, 6, 60);
    const debtToIncomeRatio = monthlyIncome > 0 ? ((estimatedPayment / monthlyIncome) * 100).toFixed(1) : '0';
    
    if (lowerQ.includes('afford') || lowerQ.includes('budget')) {
      return `Based on your profile:\n\n• Monthly Income: $${monthlyIncome.toLocaleString()}\n• Estimated Car Payment: $${estimatedPayment.toLocaleString()}\n• Debt-to-Income Ratio: ${debtToIncomeRatio}%\n\nGenerally, your car payment should be no more than 10-15% of your gross monthly income. Your estimated ratio of ${debtToIncomeRatio}% ${parseFloat(debtToIncomeRatio) <= 15 ? 'looks great!' : 'might be on the higher side - consider a lower-priced vehicle or larger down payment.'}`;
    } else if (lowerQ.includes('debt') && lowerQ.includes('income')) {
      return `Your estimated debt-to-income ratio for this car loan would be ${debtToIncomeRatio}%. This is ${parseFloat(debtToIncomeRatio) <= 15 ? 'excellent' : parseFloat(debtToIncomeRatio) <= 20 ? 'good' : 'high'} for an auto loan. Lenders typically prefer to see auto loan DTI below 20%.`;
    } else if (lowerQ.includes('payment') || lowerQ.includes('monthly')) {
      return `Based on the ${userData.vinOrModel} at $${vehiclePrice.toLocaleString()} with your $${(downPayment + tradeInValue).toLocaleString()} down payment, your estimated monthly payment would be around $${estimatedPayment.toLocaleString()} (assuming 6% APR over 60 months). This could vary based on the actual APR you qualify for.`;
    } else if (lowerQ.includes('rate') || lowerQ.includes('apr') || lowerQ.includes('interest')) {
      return `Based on your income of $${monthlyIncome.toLocaleString()}/month and account balance of $${accountBalance.toLocaleString()}, you're likely to qualify for competitive rates. Typical APRs range from 4-8% for well-qualified buyers. Your exact rate will depend on your credit score and the lender's assessment.`;
    } else if (lowerQ.includes('credit') || lowerQ.includes('score')) {
      return `I don't have access to your actual credit score, but based on your stable income and healthy account balance, you appear to be in good financial standing. Most lenders will pull your credit score during the application process to determine your exact rate.`;
    } else if (lowerQ.includes('down payment') || lowerQ.includes('trade')) {
      const totalDown = downPayment + tradeInValue;
      const downPaymentPercent = vehiclePrice > 0 ? ((totalDown / vehiclePrice) * 100).toFixed(1) : '0';
      return `Your total down payment of $${totalDown.toLocaleString()} (including trade-in) represents ${downPaymentPercent}% of the vehicle price. This is ${parseFloat(downPaymentPercent) >= 20 ? 'excellent' : parseFloat(downPaymentPercent) >= 10 ? 'good' : 'minimal'} - a larger down payment typically results in better loan terms.`;
    } else {
      return `I'd be happy to help with that! Based on your profile, you're looking at a ${userData.vinOrModel} with a loan amount of about $${loanAmount.toLocaleString()}. Is there something specific about your auto loan or finances you'd like me to explain?`;
    }
  };

  return { handleFreeChatQuestion };
};
