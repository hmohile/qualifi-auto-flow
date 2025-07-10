
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Zap, TrendingDown } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";

const Index = () => {
  const [showChat, setShowChat] = useState(false);

  const benefits = [
    {
      icon: TrendingDown,
      title: "Better Rates",
      description: "AI matches you to lenders with your best rates"
    },
    {
      icon: Zap,
      title: "One Application",
      description: "Fill out once, get matched to multiple lenders"
    },
    {
      icon: Shield,
      title: "No Spam",
      description: "Zero cold calls or repetitive paperwork"
    }
  ];

  if (showChat) {
    return <ChatInterface />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="text-2xl font-bold text-primary">Qualifi Auto</div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              AI-powered auto loan
              <span className="text-primary block">pre-approval in minutes</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get matched to the best auto loan rates without the hassle. 
              One application, multiple lenders, zero spam.
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowChat(true)}
            >
              Get Started
            </Button>
            <p className="text-sm text-muted-foreground">
              Free pre-approval • No impact to credit score initially
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-4 p-6 rounded-lg bg-card border">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 space-y-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>5-star rated</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
