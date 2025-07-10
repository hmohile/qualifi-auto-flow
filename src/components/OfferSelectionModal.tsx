
import { useState } from 'react';
import { LenderQuote } from '@/services/mockLenderAPI';
import { useUserData } from '@/hooks/useUserData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, FileText, Clock, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OfferSelectionModalProps {
  quote: LenderQuote;
  isOpen: boolean;
  onClose: () => void;
}

const OfferSelectionModal = ({ quote, isOpen, onClose }: OfferSelectionModalProps) => {
  const { userData, updateUserData } = useUserData();
  const [consents, setConsents] = useState({
    termsAccepted: false,
    dataSharing: false,
    creditCheck: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCost = quote.monthlyPayment * quote.termLength;
  const totalInterest = totalCost - quote.maxLoanAmount;
  const totalFees = quote.fees.processing + quote.fees.documentation + quote.fees.prepaymentPenalty;

  const handleSubmit = async () => {
    if (!consents.termsAccepted || !consents.dataSharing || !consents.creditCheck) {
      toast({
        title: "Please accept all required consents",
        description: "All consents are required to proceed with your loan application.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call to record selection
    try {
      // Store the selected offer
      updateUserData({
        selectedLenderId: quote.lenderId,
        selectedOfferDetails: {
          lenderName: quote.lenderName,
          apr: quote.offeredAPR,
          monthlyPayment: quote.monthlyPayment,
          termLength: quote.termLength,
          selectedAt: new Date().toISOString(),
        }
      });

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Offer Selected Successfully!",
        description: `Your application with ${quote.lenderName} has been submitted. You'll receive next steps via email within 24 hours.`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your selection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirm Your Loan Selection
          </DialogTitle>
          <DialogDescription>
            Review the terms and provide consent to proceed with {quote.lenderName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Offer Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{quote.lenderName}</h3>
                  {quote.status === 'negotiated' && (
                    <Badge className="bg-yellow-500 text-white text-xs">
                      Negotiated Rate
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {quote.offeredAPR.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">APR</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">Monthly Payment</div>
                    <div className="text-lg font-bold">${quote.monthlyPayment}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">Loan Term</div>
                    <div className="text-lg font-bold">{quote.termLength} months</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Loan Amount</div>
                  <div className="font-semibold">${quote.maxLoanAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Total Cost</div>
                  <div className="font-semibold">${totalCost.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Total Interest</div>
                  <div className="font-semibold">${totalInterest.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Total Fees</div>
                  <div className="font-semibold">${totalFees.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This offer expires in {Math.ceil((new Date(quote.expirationTime).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days. 
                    Final approval is subject to credit verification and lender underwriting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent Checkboxes */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Required Consents
            </h4>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={consents.termsAccepted}
                  onCheckedChange={(checked) => 
                    setConsents(prev => ({ ...prev, termsAccepted: checked as boolean }))
                  }
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                    I accept the loan terms and conditions
                  </label>
                  <p className="text-xs text-gray-600">
                    You agree to the APR, payment schedule, and fees outlined above.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="data"
                  checked={consents.dataSharing}
                  onCheckedChange={(checked) => 
                    setConsents(prev => ({ ...prev, dataSharing: checked as boolean }))
                  }
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="data" className="text-sm font-medium cursor-pointer">
                    I consent to sharing my information with {quote.lenderName}
                  </label>
                  <p className="text-xs text-gray-600">
                    Your profile and financial information will be shared to complete the application.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="credit"
                  checked={consents.creditCheck}
                  onCheckedChange={(checked) => 
                    setConsents(prev => ({ ...prev, creditCheck: checked as boolean }))
                  }
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="credit" className="text-sm font-medium cursor-pointer">
                    I authorize a hard credit check
                  </label>
                  <p className="text-xs text-gray-600">
                    This may temporarily impact your credit score but is required for final approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !consents.termsAccepted || !consents.dataSharing || !consents.creditCheck}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Selection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferSelectionModal;
