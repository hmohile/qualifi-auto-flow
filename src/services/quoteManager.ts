
import { LenderQuote, LenderQuoteRequest, requestLenderQuote } from './mockLenderAPI';
import { AILoanNegotiator, NegotiationResult } from './negotiationEngine';
import { lenderData } from '@/data/lenders';
import { matchBorrowerToLenders } from '@/utils/lenderMatching';

export interface QuoteSession {
  sessionId: string;
  borrowerProfile: any;
  status: 'requesting' | 'collecting' | 'negotiating' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  quotes: LenderQuote[];
  negotiationResult?: NegotiationResult;
  createdAt: Date;
  updatedAt: Date;
}

export type QuoteProgressCallback = (session: QuoteSession) => void;

export class QuoteManager {
  private sessions: Map<string, QuoteSession> = new Map();
  private negotiator: AILoanNegotiator;

  constructor() {
    this.negotiator = new AILoanNegotiator();
  }

  async startQuoteCollection(
    borrowerProfile: any,
    progressCallback?: QuoteProgressCallback
  ): Promise<QuoteSession> {
    const sessionId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get eligible lenders from existing matching logic
    const matchResult = matchBorrowerToLenders(borrowerProfile);
    const eligibleLenders = matchResult.matches.map(match => match.lender);
    
    console.log(`Starting quote collection for ${eligibleLenders.length} eligible lenders`);

    const session: QuoteSession = {
      sessionId,
      borrowerProfile,
      status: 'requesting',
      progress: {
        total: eligibleLenders.length,
        completed: 0,
        failed: 0
      },
      quotes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);
    
    // Notify initial progress
    progressCallback?.(session);

    // Start collecting quotes asynchronously
    this.collectQuotesAsync(session, eligibleLenders, progressCallback);

    return session;
  }

  private async collectQuotesAsync(
    session: QuoteSession,
    eligibleLenders: any[],
    progressCallback?: QuoteProgressCallback
  ) {
    session.status = 'collecting';
    session.updatedAt = new Date();
    progressCallback?.(session);

    const quotePromises = eligibleLenders.map(async (lender) => {
      try {
        const request: LenderQuoteRequest = {
          borrowerProfile: {
            monthlyIncome: parseInt(session.borrowerProfile.monthlyIncome?.replace(/[$,]/g, '') || '0'),
            estimatedCreditScore: session.borrowerProfile.estimatedCreditScore || 650,
            employmentType: session.borrowerProfile.employmentType || 'Full-time',
            loanAmount: parseInt(session.borrowerProfile.purchasePrice?.replace(/[$,]/g, '') || '0') - 
                       parseInt(session.borrowerProfile.downPayment?.replace(/[$,]/g, '') || '0'),
            vehicleValue: parseInt(session.borrowerProfile.purchasePrice?.replace(/[$,]/g, '') || '0'),
            downPayment: parseInt(session.borrowerProfile.downPayment?.replace(/[$,]/g, '') || '0')
          },
          lenderId: lender.id
        };

        const quote = await requestLenderQuote(request, lender);
        
        // Update progress
        session.progress.completed++;
        session.quotes.push(quote);
        session.updatedAt = new Date();
        
        console.log(`Quote received from ${lender.name}: ${quote.offeredAPR}%`);
        
        // Notify progress update
        progressCallback?.(session);
        
        return quote;
      } catch (error) {
        console.error(`Failed to get quote from ${lender.name}:`, error);
        session.progress.failed++;
        session.updatedAt = new Date();
        progressCallback?.(session);
        return null;
      }
    });

    // Wait for all quotes to complete
    const results = await Promise.allSettled(quotePromises);
    const successfulQuotes = results
      .filter((result): result is PromiseFulfilledResult<LenderQuote> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    session.quotes = successfulQuotes;
    console.log(`Quote collection completed. Received ${successfulQuotes.length} quotes.`);

    // Start negotiation if we have quotes
    if (successfulQuotes.length > 0) {
      await this.startNegotiation(session, progressCallback);
    } else {
      session.status = 'failed';
      session.updatedAt = new Date();
      progressCallback?.(session);
    }
  }

  private async startNegotiation(
    session: QuoteSession,
    progressCallback?: QuoteProgressCallback
  ) {
    session.status = 'negotiating';
    session.updatedAt = new Date();
    progressCallback?.(session);

    console.log('Starting AI negotiation process...');

    try {
      const negotiationResult = await this.negotiator.negotiateAllQuotes(session.quotes);
      
      session.negotiationResult = negotiationResult;
      session.quotes = negotiationResult.finalQuotes;
      session.status = 'completed';
      session.updatedAt = new Date();
      
      console.log('Negotiation completed:', negotiationResult.improvementsSummary);
      
      progressCallback?.(session);
    } catch (error) {
      console.error('Negotiation failed:', error);
      session.status = 'failed';
      session.updatedAt = new Date();
      progressCallback?.(session);
    }
  }

  getSession(sessionId: string): QuoteSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): QuoteSession[] {
    return Array.from(this.sessions.values());
  }

  // Clean up expired sessions (older than 24 hours)
  cleanupExpiredSessions() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.createdAt < oneDayAgo) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Singleton instance
export const quoteManager = new QuoteManager();
