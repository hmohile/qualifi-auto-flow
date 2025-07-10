import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, TrendingUp, Shield, Zap } from "lucide-react";
import { LenderQuote } from "@/services/mockLenderAPI";

interface LenderMatch {
  lender: {
    id: string;
    name: string;
    logo?: string;
    specialPrograms: string[];
  };
  estimatedAPR: number;
  monthlyPayment: number;
  loanAmount: number;
  loanTerm: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

interface LenderResultsProps {
  matches: LenderMatch[];
  borrowerSummary: {
    monthlyIncome: number;
    loanAmount: number;
    vehicleValue: number;
    downPayment: number;
    estimatedCreditScore: number;
  };
  realTimeQuotes?: LenderQuote[];
}

const LenderResults = ({ matches, borrowerSummary, realTimeQuotes = [] }: LenderResultsProps) => {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Star className="h-4 w-4" />;
      case 'low': return <TrendingUp className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  // If we have real-time quotes, prioritize them over estimates
  const displayQuotes = realTimeQuotes.length > 0 ? realTimeQuotes : matches;
  const isRealTimeData = realTimeQuotes.length > 0;

  return (
    <div className="space-y-6">
      {/* Borrower Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Loan Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Monthly Income</span>
              <div className="text-lg font-bold text-blue-900">
                ${borrowerSummary.monthlyIncome.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Vehicle Value</span>
              <div className="text-lg font-bold text-blue-900">
                ${borrowerSummary.vehicleValue.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Down Payment</span>
              <div className="text-lg font-bold text-blue-900">
                ${borrowerSummary.downPayment.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Loan Amount</span>
              <div className="text-lg font-bold text-blue-900">
                ${borrowerSummary.loanAmount.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Estimated Credit</span>
              <div className="text-lg font-bold text-blue-900">
                {borrowerSummary.estimatedCreditScore}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
            {isRealTimeData ? (
              <>
                <Zap className="h-6 w-6 text-yellow-500" />
                🎉 Live Negotiated Quotes ({realTimeQuotes.length})
              </>
            ) : (
              <>
                🎉 Your Lender Matches ({matches.length})
              </>
            )}
          </h2>
          {isRealTimeData && (
            <Badge className="bg-green-500 text-white">AI NEGOTIATED</Badge>
          )}
        </div>
        
        {/* Display Real-Time Quotes */}
        {isRealTimeData ? (
          <>
            {realTimeQuotes.map((quote, index) => (
              <Card 
                key={quote.quoteId} 
                className={`${index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'} relative`}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-green-500 text-white">BEST RATE</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{quote.lenderName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-green-600 font-medium">Live Quote</span>
                        {quote.wasNegotiated && (
                          <Badge variant="secondary" className="text-xs">Negotiated</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        {quote.offeredAPR.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">APR</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Monthly Payment</span>
                      <div className="text-xl font-bold">${quote.monthlyPayment.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Loan Term</span>
                      <div className="text-xl font-bold">{quote.termMonths} months</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Amount</span>
                      <div className="text-xl font-bold">${quote.loanAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Interest</span>
                      <div className="text-xl font-bold">
                        ${((quote.monthlyPayment * quote.termMonths) - quote.loanAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {quote.fees && quote.fees.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700">Fees:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {quote.fees.map((fee, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {fee.type}: ${fee.amount}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant={index === 0 ? "default" : "outline"}
                    >
                      Accept Quote & Continue
                    </Button>
                    <Button variant="ghost" size="sm">
                      Save for Later
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Quote expires: {new Date(quote.expiresAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          /* Display Estimated Matches */
          <>
            {matches.map((match, index) => (
              <Card 
                key={match.lender.id} 
                className={`${index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'} relative`}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-green-500 text-white">BEST RATE</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{match.lender.name}</CardTitle>
                      <div className={`flex items-center gap-1 mt-1 ${getConfidenceColor(match.confidence)}`}>
                        {getConfidenceIcon(match.confidence)}
                        <span className="text-sm capitalize">{match.confidence} confidence match</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        {match.estimatedAPR.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">Estimated APR</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Monthly Payment</span>
                      <div className="text-xl font-bold">${match.monthlyPayment.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Loan Term</span>
                      <div className="text-xl font-bold">{match.loanTerm} months</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Amount</span>
                      <div className="text-xl font-bold">${match.loanAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Interest</span>
                      <div className="text-xl font-bold">
                        ${((match.monthlyPayment * match.loanTerm) - match.loanAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {match.lender.specialPrograms.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700">Special Programs:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.lender.specialPrograms.map((program, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {program}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant={index === 0 ? "default" : "outline"}
                    >
                      View Details & Apply
                    </Button>
                    <Button variant="ghost" size="sm">
                      Save for Later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          {isRealTimeData 
            ? "These are live quotes from lenders. Rates and terms are guaranteed until expiration date."
            : "These are preliminary estimates based on your profile. Final rates may vary after credit check."
          }
        </p>
        <Button variant="outline" size="sm">
          Download Summary Report
        </Button>
      </div>
    </div>
  );
};

export default LenderResults;
