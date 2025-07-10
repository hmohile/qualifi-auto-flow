
import { LenderQuote } from '@/services/mockLenderAPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, Calculator, Award, Download } from 'lucide-react';

interface OfferSummaryProps {
  quotes: LenderQuote[];
}

const OfferSummary = ({ quotes }: OfferSummaryProps) => {
  if (quotes.length === 0) return null;

  const bestAPR = Math.min(...quotes.map(q => q.offeredAPR));
  const worstAPR = Math.max(...quotes.map(q => q.offeredAPR));
  const avgAPR = quotes.reduce((sum, q) => sum + q.offeredAPR, 0) / quotes.length;
  
  const bestQuote = quotes.find(q => q.offeredAPR === bestAPR);
  const worstQuote = quotes.find(q => q.offeredAPR === worstAPR);
  
  const potentialSavings = worstQuote && bestQuote ? 
    (worstQuote.monthlyPayment - bestQuote.monthlyPayment) * bestQuote.termLength : 0;

  const negotiatedCount = quotes.filter(q => q.status === 'negotiated').length;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Your Offer Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">{quotes.length}</div>
            <div className="text-sm text-gray-600">Total Offers</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{bestAPR.toFixed(2)}%</div>
            <div className="text-sm text-gray-600">Best APR</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{avgAPR.toFixed(2)}%</div>
            <div className="text-sm text-gray-600">Average APR</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-orange-600">${potentialSavings.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Potential Savings</div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {negotiatedCount > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span>{negotiatedCount} offers were negotiated for better terms</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calculator className="h-4 w-4 mr-2" />
              Loan Calculator
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Summary
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferSummary;
