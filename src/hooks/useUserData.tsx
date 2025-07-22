import { useState, useContext, createContext, ReactNode } from 'react';

export interface UserData {
  // Core loan application fields
  carMakeModel?: string;
  totalBudget?: string;
  downPayment?: string;
  annualIncome?: string;
  creditScore?: string;
  employmentStatus?: string;
  
  // Legacy fields (keeping for compatibility)
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  ssn?: string;
  employmentType?: string;
  employerName?: string;
  vehicleType?: string;
  vinOrModel?: string;
  purchasePrice?: string;
  tradeInValue?: string;
  monthlyIncome?: string;
  accountBalance?: string;
  consentToShare?: boolean;
  consentToCreditCheck?: boolean;
  plaidConnected?: boolean;
  accessToken?: string;
  selectedLenderId?: string;
  selectedOfferDetails?: {
    lenderName: string;
    apr: number;
    monthlyPayment: number;
    termLength: number;
    selectedAt: string;
  };
}

interface UserDataContextType {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  clearUserData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData>({});

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const clearUserData = () => {
    setUserData({});
  };

  return (
    <UserDataContext.Provider value={{ userData, updateUserData, clearUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
