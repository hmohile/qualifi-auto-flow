
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PlaidLinkButtonProps {
  onSuccess: (data: any) => void;
}

const PlaidLinkButton = ({ onSuccess }: PlaidLinkButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  // Generate more realistic mock data
  const generateMockPlaidData = () => {
    const incomes = ["$3,200", "$4,500", "$5,800", "$6,500", "$7,200", "$8,900", "$10,400"];
    const balances = ["$2,400", "$5,600", "$8,900", "$12,300", "$18,500", "$25,000", "$32,100"];
    const names = [
      "Sarah Johnson", "Michael Chen", "Jessica Rodriguez", "David Thompson", 
      "Emily Davis", "James Wilson", "Ashley Brown", "Christopher Lee"
    ];
    const employers = [
      "Microsoft Corporation", "Amazon Web Services", "Johnson & Johnson", 
      "Wells Fargo Bank", "Apple Inc", "Google LLC", "Tesla Inc", 
      "JPMorgan Chase", "Salesforce", "Adobe Systems"
    ];
    
    const randomIncome = incomes[Math.floor(Math.random() * incomes.length)];
    const randomBalance = balances[Math.floor(Math.random() * balances.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomEmployer = employers[Math.floor(Math.random() * employers.length)];
    
    // Generate email from name
    const emailName = randomName.toLowerCase().replace(" ", ".");
    const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
    const randomEmail = `${emailName}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`;
    
    return {
      fullName: randomName,
      email: randomEmail,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      employerName: randomEmployer,
      monthlyIncome: randomIncome,
      accountBalance: randomBalance,
      accessToken: `plaid_access_token_${Date.now()}`
    };
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate Plaid connection process
    try {
      setTimeout(() => {
        const mockPlaidData = generateMockPlaidData();
        console.log('Generated mock Plaid data:', mockPlaidData);
        
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
