import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Phone, Mail } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { searchAutoLoansWithOpenAI } from '@/services/openaiLoanSearchService';

interface LoanOffer {
  lenderName: string;
  apr: number;
  loanTerm: number;
  monthlyPayment: number;
  specialBenefits: string[];
}

interface LoanSearchResult {
  offers: LoanOffer[];
  creditSegment: string;
  recommendations: string[];
  canApplyDirectly: boolean;
}

const OpenAILoanResults = () => {
  const { userData } = useUserData();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<LoanSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchLoans = async () => {
      if (!userData.carMakeModel || !userData.totalBudget || !userData.downPayment || 
          !userData.annualIncome || !userData.creditScore) {
        setError('Missing required information');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const loanData = {
          carMakeModel: userData.carMakeModel,
          totalBudget: userData.totalBudget,
          downPayment: userData.downPayment,
          annualIncome: userData.annualIncome,
          creditScore: userData.creditScore
        };

        const searchResults = await searchAutoLoansWithOpenAI(loanData);
        setResults(searchResults);
      } catch (err) {
        setError('Failed to search for loan options');
        console.error('Loan search error:', err);
      } finally {
        setLoading(false);
      }
    };

    searchLoans();
  }, [userData]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Searching for the best auto loan options...</p>
          <p className="text-sm text-muted-foreground mt-2">Using AI to find personalized matches</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !results) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="py-8">
          <p className="text-destructive text-center">{error || 'No loan options found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Segment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Your Credit Profile</span>
            <Badge variant="outline">{results.creditSegment}</Badge>
          </CardTitle>
          <CardDescription>
            Based on your credit profile, here are your personalized loan options
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Loan Offers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Best Auto Loan Matches</h3>
        {results.offers.map((offer, index) => (
          <Card key={index} className={index === 0 ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{offer.lenderName}</CardTitle>
                  {index === 0 && <Badge className="mt-1">Best Match</Badge>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{offer.apr.toFixed(2)}% APR</div>
                  <div className="text-sm text-muted-foreground">{offer.loanTerm} months</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estimated Monthly Payment:</span>
                  <span className="text-xl font-bold">${offer.monthlyPayment.toLocaleString()}</span>
                </div>
                
                {offer.specialBenefits.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Special Benefits:</p>
                    <div className="flex flex-wrap gap-2">
                      {offer.specialBenefits.map((benefit, i) => (
                        <Badge key={i} variant="secondary">{benefit}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                  <Button variant="outline" size="sm">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
            <CardDescription>
              Tips to help you get the best loan terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Ready to Apply?</CardTitle>
          <CardDescription>
            Choose how you'd like to proceed with your auto loan application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex flex-col items-center gap-2 h-auto py-4">
              <ExternalLink className="w-6 h-6" />
              <span>Apply Directly Online</span>
              <span className="text-xs opacity-70">Quick online application</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Phone className="w-6 h-6" />
              <span>Talk to an Advisor</span>
              <span className="text-xs opacity-70">Get personalized guidance</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Mail className="w-6 h-6" />
              <span>Email Follow-up</span>
              <span className="text-xs opacity-70">Receive details via email</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenAILoanResults;