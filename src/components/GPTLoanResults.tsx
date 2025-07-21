import { useState, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Star, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { searchAutoLoans, LoanSearchResponse } from '@/services/gptLoanSearchService';
import { useToast } from "@/components/ui/use-toast";

const GPTLoanResults = () => {
  const { userData } = useUserData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loanData, setLoanData] = useState<LoanSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await searchAutoLoans(userData);
        setLoanData(results);
      } catch (err) {
        setError('Failed to search for loan options. Please try again.');
        toast({
          title: "Search Error",
          description: "Unable to find loan options. Please check your information and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    searchLoans();
  }, [userData, toast]);

  const handleApplyDirect = (lenderName: string) => {
    toast({
      title: "Apply Directly",
      description: `Opening application for ${lenderName}. You'll be redirected to their website.`,
    });
  };

  const handleConnectAdvisor = () => {
    toast({
      title: "Loan Advisor",
      description: "A loan advisor will contact you within 24 hours to discuss your options.",
    });
  };

  const handleEmailFollowup = () => {
    toast({
      title: "Follow-up Scheduled",
      description: "We'll send you a detailed comparison and additional options via email.",
    });
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Searching for your best auto loan options...</h3>
              <p className="text-sm text-muted-foreground">
                We're analyzing your profile and comparing rates from major US lenders
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !loanData) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Unable to Search Loans</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestOffer = loanData.offers[0];
  const worstOffer = loanData.offers[loanData.offers.length - 1];
  const potentialSavings = worstOffer ? (worstOffer.estimatedMonthlyPayment - bestOffer.estimatedMonthlyPayment) * bestOffer.loanTerm : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-green-800">
            <CheckCircle className="h-6 w-6" />
            Your Auto Loan Options for {userData.carMakeModel}
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Credit Segment</div>
              <div className="text-lg font-bold text-green-700">{loanData.creditSegment}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Loan Amount</div>
              <div className="text-lg font-bold">
                ${(parseFloat(userData.totalBudget?.replace(/[^0-9.]/g, '') || '0') - 
                   parseFloat(userData.downPayment?.replace(/[^0-9.]/g, '') || '0')).toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Best APR Found</div>
              <div className="text-lg font-bold text-green-600">{bestOffer.apr}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Potential Monthly Savings</div>
              <div className="text-lg font-bold text-green-600">
                ${potentialSavings > 0 ? potentialSavings.toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loan Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Best Auto Loan Matches ({loanData.offers.length} found)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lender Name</TableHead>
                <TableHead>APR</TableHead>
                <TableHead>Loan Term</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead>Special Benefits</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanData.offers.map((offer, index) => (
                <TableRow key={offer.lenderName} className={index === 0 ? 'bg-green-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{offer.lenderName}</div>
                      {index === 0 && <Badge className="bg-green-500 text-white text-xs">BEST RATE</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg font-bold text-green-600">{offer.apr}%</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{offer.loanTerm} months</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg font-bold">${offer.estimatedMonthlyPayment.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {offer.specialBenefits.slice(0, 2).map((benefit, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs block w-fit">
                          {benefit}
                        </Badge>
                      ))}
                      {offer.specialBenefits.length > 2 && (
                        <div className="text-xs text-gray-500">+{offer.specialBenefits.length - 2} more</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant={index === 0 ? "default" : "outline"}
                      onClick={() => handleApplyDirect(offer.lenderName)}
                    >
                      Apply Now
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {loanData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {loanData.alternativeSuggestions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                Alternative Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {loanData.alternativeSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">What would you like to do next?</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => handleApplyDirect(bestOffer.lenderName)}
                className="bg-green-600 hover:bg-green-700"
              >
                Apply with Best Rate ({bestOffer.lenderName})
              </Button>
              <Button variant="outline" onClick={handleConnectAdvisor}>
                Connect to Loan Advisor
              </Button>
              <Button variant="outline" onClick={handleEmailFollowup}>
                Email Me Details
              </Button>
            </div>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Ready to move forward? Choose your preferred option above. Our friendly, supportive team is here to help you secure the best auto loan for your needs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPTLoanResults;