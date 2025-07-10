
import { useUserData } from '@/hooks/useUserData';

export const useFreeChatHandler = () => {
  const { userData } = useUserData();

  const handleFreeChatQuestion = async (question: string): Promise<string> => {
    const lowerQuestion = question.toLowerCase();
    
    // Parse user's financial data
    const monthlyIncome = parseInt(userData.monthlyIncome?.replace(/[,$]/g, '') || '0');
    const downPayment = parseInt(userData.downPayment?.replace(/[,$]/g, '') || '0');
    const tradeInValue = parseInt(userData.tradeInValue?.replace(/[,$]/g, '') || '0');
    const accountBalance = parseInt(userData.accountBalance?.replace(/[,$]/g, '') || '0');
    
    // Estimate vehicle price if available
    let vehiclePrice = 0;
    if (userData.purchasePrice) {
      vehiclePrice = parseInt(userData.purchasePrice.replace(/[,$]/g, '') || '0');
    }
    
    const totalDownPayment = downPayment + tradeInValue;
    const loanAmount = vehiclePrice - totalDownPayment;
    const estimatedMonthlyPayment = loanAmount > 0 ? Math.round((loanAmount * 0.06) / 12 + loanAmount / 60) : 0;

    // Affordability questions
    if (lowerQuestion.includes('afford') || lowerQuestion.includes('can i')) {
      if (!vehiclePrice || vehiclePrice === 0) {
        return "I'd be happy to help you determine affordability! However, I need to know which specific vehicle you're interested in first. Could you tell me the make, model, and year of the car you're considering?";
      }

      const affordabilityRatio = (estimatedMonthlyPayment / monthlyIncome) * 100;
      
      if (affordabilityRatio <= 15) {
        return `Great news! Based on your monthly income of ${userData.monthlyIncome}, this vehicle looks very affordable for you. Your estimated monthly payment of $${estimatedMonthlyPayment} would be only ${affordabilityRatio.toFixed(1)}% of your income, which is well within the recommended 15-20% range. You should have no problem qualifying for excellent rates!`;
      } else if (affordabilityRatio <= 20) {
        return `Yes, you can likely afford this vehicle! Your estimated monthly payment of $${estimatedMonthlyPayment} would be ${affordabilityRatio.toFixed(1)}% of your ${userData.monthlyIncome} monthly income. This is within the generally recommended range of 15-20%. You should qualify for competitive rates.`;
      } else if (affordabilityRatio <= 25) {
        return `This vehicle might be a stretch for your budget. The estimated monthly payment of $${estimatedMonthlyPayment} would be ${affordabilityRatio.toFixed(1)}% of your income. While possible, I'd recommend considering a less expensive vehicle or increasing your down payment to keep payments below 20% of your income.`;
      } else {
        return `This vehicle appears to be outside your comfortable budget range. At $${estimatedMonthlyPayment} per month, it would consume ${affordabilityRatio.toFixed(1)}% of your income. I'd strongly recommend looking at vehicles in a lower price range or significantly increasing your down payment.`;
      }
    }

    // Payment questions
    if (lowerQuestion.includes('payment') || lowerQuestion.includes('monthly')) {
      if (!vehiclePrice || vehiclePrice === 0) {
        return "To calculate your monthly payment, I need to know the specific vehicle you're interested in. What car are you looking to finance?";
      }
      
      return `Based on the vehicle price of $${vehiclePrice.toLocaleString()}, your down payment of $${downPayment.toLocaleString()}, and trade-in value of $${tradeInValue.toLocaleString()}, your estimated monthly payment would be around $${estimatedMonthlyPayment} for a 60-month loan at approximately 6% APR. The exact rate will depend on your credit score and the lender you choose.`;
    }

    // Rate questions
    if (lowerQuestion.includes('rate') || lowerQuestion.includes('apr') || lowerQuestion.includes('interest')) {
      return `Based on your strong financial profile with ${userData.monthlyIncome} monthly income and ${userData.accountBalance} in savings, you should qualify for competitive rates. Expect anywhere from 4.5% to 7.5% APR depending on your credit score, the vehicle age, and loan term. ${userData.vehicleType === 'New' ? 'New vehicles typically get the best rates!' : 'Used vehicles may have slightly higher rates, but you can still get great deals.'}`;
    }

    // Credit questions
    if (lowerQuestion.includes('credit') || lowerQuestion.includes('score')) {
      return `I don't pull your credit score during this pre-qualification, but based on your stable income and savings, you appear to be in good financial standing. Most of our lenders work with a wide range of credit scores. When you apply, they'll do a soft credit check first to give you accurate rates without impacting your score.`;
    }

    // Down payment questions
    if (lowerQuestion.includes('down payment') || lowerQuestion.includes('down')) {
      const downPaymentPercentage = vehiclePrice > 0 ? (totalDownPayment / vehiclePrice) * 100 : 0;
      
      if (downPaymentPercentage >= 20) {
        return `Your down payment strategy looks excellent! With $${totalDownPayment.toLocaleString()} down (${downPaymentPercentage.toFixed(1)}% of the vehicle price), you'll likely qualify for the best rates and have lower monthly payments. This shows lenders you're a low-risk borrower.`;
      } else if (downPaymentPercentage >= 10) {
        return `Your down payment of $${totalDownPayment.toLocaleString()} is solid. While putting down 20% or more can get you the best rates, ${downPaymentPercentage.toFixed(1)}% is still a good start and should help you secure competitive financing.`;
      } else {
        return `Consider increasing your down payment if possible. Currently at $${totalDownPayment.toLocaleString()}, a larger down payment would reduce your monthly payments and help you qualify for better rates. Even getting to 10-15% down can make a significant difference.`;
      }
    }

    // Vehicle questions
    if (lowerQuestion.includes('car') || lowerQuestion.includes('vehicle') || lowerQuestion.includes('auto')) {
      if (userData.vinOrModel) {
        return `You mentioned interest in a ${userData.vinOrModel}. ${userData.vehicleType === 'New' ? 'New vehicles come with manufacturer warranties and the latest features, plus they qualify for the best financing rates.' : 'Used vehicles can be a great value, offering lower insurance costs and less depreciation.'} Based on your income and savings, this seems like a good fit for your budget.`;
      } else {
        return "I'd be happy to help you think about vehicle selection! What type of vehicle are you considering? Are you looking at new or used, and do you have any specific makes or models in mind?";
      }
    }

    // General financial advice
    if (lowerQuestion.includes('advice') || lowerQuestion.includes('recommend') || lowerQuestion.includes('suggest')) {
      return `Based on your financial profile, here's my advice: With ${userData.monthlyIncome} monthly income and ${userData.accountBalance} in savings, you're in a strong position. Focus on vehicles where your total monthly payment (including insurance) stays under 20% of your income. ${userData.vehicleType === 'New' ? 'New vehicles offer better rates and warranties.' : 'Used vehicles 2-4 years old often provide the best value.'} Shop around with multiple lenders - we'll help you find the best rates!`;
    }

    // Default response
    return `That's a great question! I have access to your financial information and can help with questions about affordability, monthly payments, interest rates, or vehicle recommendations. What specific aspect of your auto loan would you like to explore? For example, you could ask "Can I afford this car?" or "What will my monthly payment be?"`;
  };

  return { handleFreeChatQuestion };
};
