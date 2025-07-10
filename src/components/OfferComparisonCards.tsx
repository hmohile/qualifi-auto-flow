
import { useState } from 'react';
import { LenderQuote } from '@/services/mockLenderAPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Star, Zap } from 'lucide-react';
import OfferSelectionModal from '@/components/OfferSelectionModal';

interface OfferComparisonCardsProps {
  quotes: LenderQuote[];
}

const OfferComparisonCards = ({ quotes }: OfferComparisonCardsProps) => {
  const [selectedQuote, setSelectedQuote] = useState<LenderQuote | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSelectOffer = (quote: LenderQuote) => {
    setSelectedQuote(quote);
    setShowModal(true);
  };

  const getDaysUntilExpiration = (expirationTime: Date) => {
    const now = new Date();
    const expiration = new Date(expirationTime);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getBestOfferType = (quote: LenderQuote, allQuotes: LenderQuote[]) => {
    const sortedByAPR = [...allQuotes].sort((a, b) => a.offeredAPR - b.offeredAPR);
    const sortedByPayment = [...allQuotes].sort((a, b) => a.monthlyPayment - b.monthlyPayment);
    
    if (sortedByAPR[0]?.lenderId === quote.lenderId) return 'Best Rate';
    if (sortedByPayment[0]?.lenderId === quote.lenderId) return 'Lowest Payment';
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((quote, index) => {
          const daysLeft = getDaysUntilExpiration(quote.expirationTime);
          const bestOfferType = getBestOfferType(quote, quotes);
          const totalInterest = (quote.monthlyPayment * quote.termLength) - quote.maxLoanAmount;
          const isNegotiated = quote.status === 'negotiated';

          return (
            <Card 
              key={quote.lenderId}
              className={`relative ${bestOfferType ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              {/* Best Offer Badge */}
              {bestOfferType && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-green-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    {bestOfferType}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{quote.lenderName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {isNegotiated && (
                        <>
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <Badge variant="secondary" className="text-xs">Negotiated Offer</Badge>
                        </>
                      )}
                      <Badge 
                        variant={quote.confidence === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {quote.confidence} confidence
                      </Badge>
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

              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Monthly Payment</span>
                    <div className="text-xl font-bold">${quote.monthlyPayment.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Loan Term</span>
                    <div className="text-xl font-bold">{quote.termLength} months</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Max Loan Amount</span>
                    <div className="text-lg font-semibold">${quote.maxLoanAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Interest</span>
                    <div className="text-lg font-semibold">${totalInterest.toLocaleString()}</div>
                  </div>
                </div>

                {/* Fees */}
                <div>
                  <span className="text-sm font-medium text-gray-700">Fees:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Processing: ${quote.fees.processing}
                    </Badge>
                    {quote.fees.prepaymentPenalty > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Prepayment: ${quote.fees.prepaymentPenalty}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Documentation: ${quote.fees.documentation}
                    </Badge>
                  </div>
                </div>

                {/* Expiration */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Expires in {daysLeft} days</span>
                  </div>
                  <div className="text-gray-500">
                    {new Date(quote.expirationTime).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => handleSelectOffer(quote)}
                  className={`w-full ${bestOfferType ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Choose This Loan
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Modal */}
      {selectedQuote && (
        <OfferSelectionModal
          quote={selectedQuote}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedQuote(null);
          }}
        />
      )}
    </div>
  );
};

export default OfferComparisonCards;
