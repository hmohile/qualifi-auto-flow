
import { LenderQuote, negotiateWithLender } from './mockLenderAPI';

export interface NegotiationStrategy {
  priorityOrder: ('rate_challenge' | 'fee_reduction' | 'term_request')[];
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  maxAttempts: number;
}

export interface NegotiationResult {
  originalQuotes: LenderQuote[];
  finalQuotes: LenderQuote[];
  improvementsSummary: {
    totalQuotesImproved: number;
    averageRateImprovement: number;
    totalFeesSaved: number;
  };
  negotiationLog: string[];
}

export class AILoanNegotiator {
  private strategy: NegotiationStrategy;
  private negotiationLog: string[] = [];

  constructor(strategy: NegotiationStrategy = {
    priorityOrder: ['rate_challenge', 'fee_reduction', 'term_request'],
    aggressiveness: 'moderate',
    maxAttempts: 2
  }) {
    this.strategy = strategy;
  }

  async negotiateAllQuotes(quotes: LenderQuote[]): Promise<NegotiationResult> {
    console.log('Starting AI negotiation process...');
    this.negotiationLog = [];
    
    const originalQuotes = [...quotes];
    let currentQuotes = [...quotes];
    
    // Sort quotes by APR to identify best rates for leverage
    const sortedQuotes = [...currentQuotes].sort((a, b) => a.offeredAPR - b.offeredAPR);
    const bestRate = sortedQuotes[0]?.offeredAPR;
    
    this.log(`Starting negotiation with ${quotes.length} lender quotes. Best initial rate: ${bestRate}%`);

    // Phase 1: Rate challenges using best competitor rate
    if (bestRate && this.strategy.priorityOrder.includes('rate_challenge')) {
      this.log('Phase 1: Challenging lenders with competitive rates...');
      
      for (let i = 0; i < currentQuotes.length; i++) {
        const quote = currentQuotes[i];
        
        // Skip the lender with the best rate (no point negotiating with them first)
        if (quote.offeredAPR === bestRate) continue;
        
        // Only negotiate if the difference is meaningful (>0.3%)
        if (quote.offeredAPR - bestRate > 0.3) {
          try {
            this.log(`Challenging ${quote.lenderName} (${quote.offeredAPR}%) with competitor rate of ${bestRate}%`);
            const negotiatedQuote = await negotiateWithLender(quote, bestRate, 'rate_challenge');
            currentQuotes[i] = negotiatedQuote;
            
            if (negotiatedQuote.offeredAPR < quote.offeredAPR) {
              this.log(`✅ Success! ${quote.lenderName} improved rate from ${quote.offeredAPR}% to ${negotiatedQuote.offeredAPR}%`);
            } else {
              this.log(`❌ ${quote.lenderName} declined to match competitive rate`);
            }
          } catch (error) {
            this.log(`Error negotiating with ${quote.lenderName}: ${error}`);
          }
        }
      }
    }

    // Phase 2: Fee reduction attempts
    if (this.strategy.priorityOrder.includes('fee_reduction')) {
      this.log('Phase 2: Attempting fee reductions...');
      
      for (let i = 0; i < currentQuotes.length; i++) {
        const quote = currentQuotes[i];
        const totalFees = quote.fees.processing + quote.fees.documentation + quote.fees.prepaymentPenalty;
        
        if (totalFees > 300) { // Only negotiate if fees are substantial
          try {
            this.log(`Requesting fee reduction from ${quote.lenderName} (current fees: $${totalFees})`);
            const negotiatedQuote = await negotiateWithLender(quote, 0, 'fee_reduction');
            
            if (negotiatedQuote.negotiationHistory?.some(n => n.response === 'accepted')) {
              // Simulate fee reduction
              negotiatedQuote.fees.processing = Math.floor(negotiatedQuote.fees.processing * 0.5);
              this.log(`✅ ${quote.lenderName} reduced processing fees`);
            }
            
            currentQuotes[i] = negotiatedQuote;
          } catch (error) {
            this.log(`Error negotiating fees with ${quote.lenderName}: ${error}`);
          }
        }
      }
    }

    // Calculate improvements
    const improvementsSummary = this.calculateImprovements(originalQuotes, currentQuotes);
    
    this.log(`Negotiation complete! Improved ${improvementsSummary.totalQuotesImproved} out of ${quotes.length} quotes`);
    this.log(`Average rate improvement: ${improvementsSummary.averageRateImprovement.toFixed(2)}%`);

    return {
      originalQuotes,
      finalQuotes: currentQuotes,
      improvementsSummary,
      negotiationLog: this.negotiationLog
    };
  }

  private calculateImprovements(original: LenderQuote[], final: LenderQuote[]) {
    let totalQuotesImproved = 0;
    let totalRateImprovement = 0;
    let totalFeesSaved = 0;

    for (let i = 0; i < original.length; i++) {
      const orig = original[i];
      const fin = final[i];
      
      if (fin.offeredAPR < orig.offeredAPR) {
        totalQuotesImproved++;
        totalRateImprovement += orig.offeredAPR - fin.offeredAPR;
      }
      
      const origFees = orig.fees.processing + orig.fees.documentation + orig.fees.prepaymentPenalty;
      const finFees = fin.fees.processing + fin.fees.documentation + fin.fees.prepaymentPenalty;
      totalFeesSaved += Math.max(0, origFees - finFees);
    }

    return {
      totalQuotesImproved,
      averageRateImprovement: totalQuotesImproved > 0 ? totalRateImprovement / totalQuotesImproved : 0,
      totalFeesSaved
    };
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.negotiationLog.push(logEntry);
    console.log(logEntry);
  }
}
