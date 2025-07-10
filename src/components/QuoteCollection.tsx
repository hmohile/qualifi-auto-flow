
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Zap, TrendingDown } from 'lucide-react';
import { quoteManager, QuoteSession } from '@/services/quoteManager';
import { LenderQuote } from '@/services/mockLenderAPI';

interface QuoteCollectionProps {
  borrowerProfile: any;
  onQuotesReady: (quotes: LenderQuote[]) => void;
  onBack: () => void;
}

const QuoteCollection = ({ borrowerProfile, onQuotesReady, onBack }: QuoteCollectionProps) => {
  const [session, setSession] = useState<QuoteSession | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const startCollection = async () => {
    setIsCollecting(true);
    
    try {
      const newSession = await quoteManager.startQuoteCollection(
        borrowerProfile,
        (updatedSession) => {
          setSession({ ...updatedSession });
          
          if (updatedSession.status === 'completed') {
            setIsCollecting(false);
            onQuotesReady(updatedSession.quotes);
          } else if (updatedSession.status === 'failed') {
            setIsCollecting(false);
          }
        }
      );
      
      setSession(newSession);
    } catch (error) {
      console.error('Failed to start quote collection:', error);
      setIsCollecting(false);
    }
  };

  const getStatusMessage = () => {
    if (!session) return 'Ready to start quote collection';
    
    switch (session.status) {
      case 'requesting':
        return 'Preparing to contact lenders...';
      case 'collecting':
        return `Contacting lenders... (${session.progress.completed}/${session.progress.total} responded)`;
      case 'negotiating':
        return 'Negotiating better rates with lenders...';
      case 'completed':
        return 'Quote collection and negotiation completed!';
      case 'failed':
        return 'Quote collection failed. Please try again.';
      default:
        return 'Processing...';
    }
  };

  const getProgressPercentage = () => {
    if (!session) return 0;
    
    const baseProgress = (session.progress.completed / session.progress.total) * 80; // 80% for collection
    const negotiationProgress = session.status === 'negotiating' ? 10 : 0; // 10% for negotiation
    const completionProgress = session.status === 'completed' ? 10 : 0; // 10% for completion
    
    return Math.min(100, baseProgress + negotiationProgress + completionProgress);
  };

  const renderQuotePreview = () => {
    if (!session || session.quotes.length === 0) return null;

    const sortedQuotes = [...session.quotes].sort((a, b) => a.offeredAPR - b.offeredAPR);
    const bestQuote = sortedQuotes[0];
    const improvements = session.negotiationResult?.improvementsSummary;

    return (
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Live Quote Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-600">Best Rate Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {bestQuote.offeredAPR}%
              </div>
              <div className="text-sm text-gray-600">
                {bestQuote.lenderName}
              </div>
              <div className="text-sm text-gray-600">
                ${bestQuote.monthlyPayment}/month
              </div>
              {bestQuote.status === 'negotiated' && (
                <Badge variant="secondary" className="mt-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Negotiated Rate
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-600">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {session.quotes.length}
              </div>
              <div className="text-sm text-gray-600">
                Active offers received
              </div>
              {improvements && improvements.totalQuotesImproved > 0 && (
                <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {improvements.totalQuotesImproved} rates improved
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {improvements && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Negotiation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Quotes Improved:</span>
                  <div className="font-semibold">{improvements.totalQuotesImproved}</div>
                </div>
                <div>
                  <span className="text-green-700">Avg. Rate Reduction:</span>
                  <div className="font-semibold">{improvements.averageRateImprovement.toFixed(2)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="text-2xl font-bold text-primary">Qualifi Auto</div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              Back to Chat
            </Button>
            <div className="text-sm text-muted-foreground">
              AI Quote Collection
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isCollecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : session?.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : session?.status === 'failed' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              AI Loan Shopping & Negotiation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Our AI agent will contact multiple lenders, collect real-time quotes, and negotiate better rates on your behalf.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{getStatusMessage()}</span>
                  <span className="text-sm text-gray-500">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>

              {session && session.progress.total > 0 && (
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>✅ Completed: {session.progress.completed}</span>
                  <span>⏳ Pending: {session.progress.total - session.progress.completed - session.progress.failed}</span>
                  {session.progress.failed > 0 && (
                    <span>❌ Failed: {session.progress.failed}</span>
                  )}
                </div>
              )}

              {!isCollecting && !session && (
                <Button onClick={startCollection} className="w-full" size="lg">
                  Start AI Quote Collection
                </Button>
              )}

              {session?.status === 'completed' && (
                <Button 
                  onClick={() => onQuotesReady(session.quotes)} 
                  className="w-full" 
                  size="lg"
                >
                  View All Quotes & Apply
                </Button>
              )}

              {session?.status === 'failed' && (
                <Button 
                  onClick={startCollection} 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {renderQuotePreview()}
      </div>
    </div>
  );
};

export default QuoteCollection;
