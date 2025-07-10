
import { useState, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { quoteManager, QuoteSession } from '@/services/quoteManager';
import { LenderQuote } from '@/services/mockLenderAPI';
import OfferComparisonCards from '@/components/OfferComparisonCards';
import OfferFilters from '@/components/OfferFilters';
import OfferSummary from '@/components/OfferSummary';
import AICopilot from '@/components/AICopilot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type SortOption = 'apr' | 'payment' | 'term' | 'total';
export type FilterOption = 'all' | 'bank' | 'credit-union' | 'online';

const OfferComparison = () => {
  const { userData } = useUserData();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<LenderQuote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<LenderQuote[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('apr');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showAI, setShowAI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the latest completed quote session
    const sessions = quoteManager.getAllSessions();
    const completedSession = sessions.find(s => s.status === 'completed');
    
    if (completedSession?.quotes) {
      setQuotes(completedSession.quotes);
      setFilteredQuotes(completedSession.quotes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = [...quotes];

    // Apply filters
    if (filterBy !== 'all') {
      filtered = filtered.filter(quote => {
        const lenderName = quote.lenderName.toLowerCase();
        if (filterBy === 'bank') return lenderName.includes('bank');
        if (filterBy === 'credit-union') return lenderName.includes('credit union');
        if (filterBy === 'online') return !lenderName.includes('bank') && !lenderName.includes('credit union');
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'apr':
          return a.offeredAPR - b.offeredAPR;
        case 'payment':
          return a.monthlyPayment - b.monthlyPayment;
        case 'term':
          return a.termLength - b.termLength;
        case 'total':
          const totalA = a.monthlyPayment * a.termLength;
          const totalB = b.monthlyPayment * b.termLength;
          return totalA - totalB;
        default:
          return 0;
      }
    });

    setFilteredQuotes(filtered);
  }, [quotes, sortBy, filterBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your loan offers...</p>
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Offers Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We don't have any loan offers to display yet. Please complete the quote collection process first.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Loan Offers</h1>
              <p className="text-gray-600">Compare and choose the best offer for you</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAI(!showAI)}
            className={`${showAI ? 'bg-blue-600' : 'bg-gray-600'} hover:bg-blue-700`}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary */}
            <OfferSummary quotes={quotes} />

            {/* Filters */}
            <OfferFilters 
              sortBy={sortBy}
              setSortBy={setSortBy}
              filterBy={filterBy}
              setFilterBy={setFilterBy}
            />

            {/* Offer Cards */}
            <OfferComparisonCards quotes={filteredQuotes} />
          </div>

          {/* AI Copilot Sidebar */}
          {showAI && (
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <AICopilot quotes={quotes} userData={userData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferComparison;
