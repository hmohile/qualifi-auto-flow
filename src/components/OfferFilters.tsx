
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SortOption, FilterOption } from '@/pages/OfferComparison';

interface OfferFiltersProps {
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  filterBy: FilterOption;
  setFilterBy: (filter: FilterOption) => void;
}

const OfferFilters = ({ sortBy, setSortBy, filterBy, setFilterBy }: OfferFiltersProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apr">Best APR</SelectItem>
                  <SelectItem value="payment">Lowest Payment</SelectItem>
                  <SelectItem value="term">Shortest Term</SelectItem>
                  <SelectItem value="total">Lowest Total Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lenders</SelectItem>
                  <SelectItem value="bank">Banks</SelectItem>
                  <SelectItem value="credit-union">Credit Unions</SelectItem>
                  <SelectItem value="online">Online Lenders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              💡 Tip: Lower APR usually means lower total cost
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferFilters;
