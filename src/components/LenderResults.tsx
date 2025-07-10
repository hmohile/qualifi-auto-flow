
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, TrendingUp, Shield } from "lucide-react";

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
}

const LenderResults = ({ matches, borrowerSummary }: LenderResultsProps) => {
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

      {/* Lender Matches */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
          🎉 Your Lender Matches ({matches.length})
        </h2>
        
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
                  <div className="text-sm text-gray-600">APR</div>
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
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          These are preliminary estimates based on your profile. Final rates may vary after credit check.
        </p>
        <Button variant="outline" size="sm">
          Download Summary Report
        </Button>
      </div>
    </div>
  );
};

export default LenderResults;
