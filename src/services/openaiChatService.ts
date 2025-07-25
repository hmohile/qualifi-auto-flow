interface ChatRequest {
  userInput: string;
  userData: {
    carMakeModel?: string;
    totalBudget?: string;
    downPayment?: string;
    annualIncome?: string;
    creditScore?: string;
  };
}

const userPrompt = `
Hey there 👋 You're almost set to hit the road!

Based on everything you've shared – the car you're eyeing, your downpayment preferences, and your budget – we've already done the heavy lifting to find the best financing options for you.

Now, if you have any questions – whether it's about EMIs, eligibility, delivery timelines, documents needed, or even how this car compares to another one you love – I'm right here to help, 24x7!

Just type your question below. Let's make your car buying journey smooth, easy, and exciting 🚗💨

P.S. You're closer to owning your dream car than you think! 💙
`;

export const chatWithOpenAI = async ({ userInput, userData }: ChatRequest): Promise<string> => {
  // For now, we'll simulate the OpenAI response with intelligent mock responses
  // In production, this would make an actual API call to OpenAI
  
  const lowerInput = userInput.toLowerCase();
  
  // Parse user data for context
  const budget = userData.totalBudget ? parseFloat(userData.totalBudget.replace(/[$,]/g, '')) : 0;
  const downPayment = userData.downPayment ? parseFloat(userData.downPayment.replace(/[$,]/g, '')) : 0;
  const loanAmount = budget - downPayment;
  const annualIncome = userData.annualIncome ? parseFloat(userData.annualIncome.replace(/[$,]/g, '')) : 0;
  const monthlyIncome = annualIncome / 12;
  const estimatedEMI = Math.round((loanAmount * 0.02)); // Rough calculation - defined here for use throughout
  
  // EMI/Monthly payment questions
  if (lowerInput.includes('emi') || lowerInput.includes('monthly payment') || lowerInput.includes('installment')) {
    return `Great question! Based on your ${userData.carMakeModel} with a loan amount of $${loanAmount.toLocaleString()}, your estimated monthly EMI would be around $${estimatedEMI}.\n\nThis is calculated assuming:\n• Loan amount: $${loanAmount.toLocaleString()}\n• Term: 60 months\n• Interest rate: ~6-8% (varies by credit score)\n\nWith your ${userData.creditScore} credit profile, you're likely to get competitive rates! Would you like me to show you different EMI options based on loan terms? 🚗💙`;
  }
  
  // Eligibility questions
  if (lowerInput.includes('eligibility') || lowerInput.includes('eligible') || lowerInput.includes('qualify')) {
    const debtToIncome = monthlyIncome > 0 ? (estimatedEMI / monthlyIncome) * 100 : 0;
    return `You're looking great for loan approval! Here's your eligibility snapshot:\n\n✅ **Income**: $${annualIncome.toLocaleString()}/year looks strong\n✅ **Credit**: ${userData.creditScore} credit score\n✅ **Down payment**: $${downPayment.toLocaleString()} shows commitment\n✅ **Debt-to-income ratio**: ~${debtToIncome.toFixed(1)}% (excellent if under 20%)\n\nBased on these factors, you should easily qualify for competitive rates. Most lenders love profiles like yours! Ready to move forward? 🎉`;
  }
  
  // Delivery timeline questions
  if (lowerInput.includes('delivery') || lowerInput.includes('timeline') || lowerInput.includes('when') || lowerInput.includes('time')) {
    return `Exciting! Here's your typical timeline for getting your ${userData.carMakeModel}:\n\n📋 **Loan approval**: 1-3 business days\n🚗 **Vehicle sourcing**: 3-7 days (if not in stock)\n📄 **Documentation**: 1-2 days\n🚚 **Delivery**: 7-14 days total\n\nFor faster delivery, consider:\n• Choosing in-stock vehicles\n• Having all documents ready\n• Pre-approved financing (which we're handling!)\n\nYour ${userData.carMakeModel} could be in your driveway in about 2 weeks! Want me to expedite anything? 🚗💨`;
  }
  
  // Document questions
  if (lowerInput.includes('document') || lowerInput.includes('papers') || lowerInput.includes('need') || lowerInput.includes('required')) {
    return `Great question! Here's what you'll need for your ${userData.carMakeModel} financing:\n\n📋 **Required Documents**:\n• Photo ID (driver's license)\n• Proof of income (pay stubs/tax returns)\n• Bank statements (last 2-3 months)\n• Proof of residence (utility bill)\n• Insurance quote for the vehicle\n\n📋 **Optional but helpful**:\n• Previous loan statements\n• Employment verification letter\n• Co-signer documents (if applicable)\n\nPro tip: Having these ready speeds up approval by 2-3 days! I can help you prepare a checklist. Need any specific guidance? 📄✅`;
  }
  
  // Comparison questions
  if (lowerInput.includes('compare') || lowerInput.includes('vs') || lowerInput.includes('better') || lowerInput.includes('different')) {
    return `I'd love to help you compare! Since you're considering the ${userData.carMakeModel}, what other vehicle are you thinking about?\n\nI can compare:\n🚗 **Financing options** (rates, terms, EMIs)\n💰 **Total cost of ownership**\n📊 **Resale value**\n⚡ **Features and reliability**\n🛡️ **Insurance costs**\n\nWith your budget of ${userData.totalBudget} and ${userData.downPayment} down payment, I can show you exactly how different cars would affect your monthly payments and total costs.\n\nJust tell me which car you want to compare against! 🤔💙`;
  }
  
  // Interest rate questions
  if (lowerInput.includes('interest') || lowerInput.includes('rate') || lowerInput.includes('apr')) {
    return `Perfect question! Based on your ${userData.creditScore} credit score, here's what you can expect:\n\n📈 **Your estimated rate range**: 5.5% - 7.5% APR\n\n**Factors working in your favor**:\n✅ ${userData.creditScore} credit score\n✅ Solid income of $${annualIncome.toLocaleString()}/year\n✅ Good down payment of ${userData.downPayment}\n\n**Ways to get even better rates**:\n• Shorter loan term (36-48 months)\n• Larger down payment\n• Bank/credit union membership\n• Pre-approved financing\n\nWith your profile, you're in great shape for competitive rates! Want to see how different rates affect your EMI? 💪`;
  }
  
  // Default response
  return `Thanks for your question! I'm here to help with anything about your ${userData.carMakeModel} purchase.\n\nI can assist with:\n🚗 **Vehicle details** & comparisons\n💰 **EMI calculations** & payment options\n📋 **Eligibility requirements** & documentation\n🚚 **Delivery timelines** & process\n📊 **Rate comparisons** & financing options\n\nBased on your budget of ${userData.totalBudget} and ${userData.downPayment} down payment, you're in a great position! What specific aspect would you like to explore?\n\nFeel free to ask me anything - I'm here 24x7 to make your car buying journey smooth! 🚗💨`;
};

// Future implementation would use actual OpenAI API:
/*
export const chatWithOpenAI = async ({ userInput, userData }: ChatRequest): Promise<string> => {
  const messages = [
    { 
      role: "system", 
      content: "You are a friendly car financing assistant helping users with queries about buying a car, based on their input like car model, downpayment, budget, and preferences. Be enthusiastic and use emojis appropriately."
    },
    { role: "user", content: userPrompt },
    { role: "user", content: `User context: ${JSON.stringify(userData)}` },
    { role: "user", content: userInput }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: messages,
      temperature: 0.8,
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sorry, something went wrong!";
};
*/
