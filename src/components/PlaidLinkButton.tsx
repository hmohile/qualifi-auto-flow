
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PlaidLinkButtonProps {
  onSuccess: (data: any) => void;
}

const PlaidLinkButton = ({ onSuccess }: PlaidLinkButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate Plaid connection process
    try {
      // In a real implementation, this would integrate with Plaid Link
      setTimeout(() => {
        // Mock successful connection with sample data
        const mockPlaidData = {
          fullName: "John Doe",
          email: "john.doe@email.com",
          phone: "(555) 123-4567",
          employerName: "Tech Solutions Inc",
          monthlyIncome: "$6,500",
          accountBalance: "$18,500",
          accessToken: "mock_access_token_123"
        };
        
        onSuccess(mockPlaidData);
        setIsConnecting(false);
        
        toast({
          title: "Bank Connected Successfully",
          description: "Your bank account has been securely connected.",
        });
      }, 3000);
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "There was an error connecting your bank account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting securely...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Connect Bank Account
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>🔒 Bank-level 256-bit encryption</p>
        <p>We use Plaid to securely connect to your bank</p>
        <p>Your login credentials are never stored</p>
      </div>
    </div>
  );
};

export default PlaidLinkButton;
