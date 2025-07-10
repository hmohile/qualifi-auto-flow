
// Mock vehicle pricing data - in production this would connect to KBB/Edmunds API
interface VehiclePrice {
  make: string;
  model: string;
  year: number;
  estimatedValue: number;
  isNew: boolean;
}

const mockVehiclePrices: VehiclePrice[] = [
  // Popular vehicles with realistic 2024 pricing
  { make: "Toyota", model: "Camry", year: 2024, estimatedValue: 28000, isNew: true },
  { make: "Toyota", model: "Camry", year: 2023, estimatedValue: 25000, isNew: false },
  { make: "Toyota", model: "RAV4", year: 2024, estimatedValue: 32000, isNew: true },
  { make: "Honda", model: "Civic", year: 2024, estimatedValue: 25000, isNew: true },
  { make: "Honda", model: "Accord", year: 2024, estimatedValue: 30000, isNew: true },
  { make: "Ford", model: "F-150", year: 2024, estimatedValue: 38000, isNew: true },
  { make: "Chevrolet", model: "Equinox", year: 2024, estimatedValue: 29000, isNew: true },
  { make: "Nissan", model: "Altima", year: 2024, estimatedValue: 26000, isNew: true },
  { make: "Hyundai", model: "Elantra", year: 2024, estimatedValue: 23000, isNew: true },
  { make: "Subaru", model: "Outback", year: 2024, estimatedValue: 31000, isNew: true },
];

export const parseVehicleInfo = (vinOrModel: string) => {
  if (!vinOrModel) return null;
  
  // Simple parsing logic - in production would use VIN decoder or better NLP
  const input = vinOrModel.toLowerCase().trim();
  
  // Check if it's a VIN (17 characters, alphanumeric)
  if (input.length === 17 && /^[a-z0-9]+$/i.test(input)) {
    // Mock VIN decoding - would call real VIN API
    return {
      make: "Toyota",
      model: "Camry",
      year: 2023,
      estimatedValue: 25000,
      isNew: false,
      confidence: "high"
    };
  }
  
  // Try to parse make/model/year from text
  const words = input.split(/\s+/);
  let year = new Date().getFullYear(); // Default to current year
  let make = "";
  let model = "";
  
  // Look for year (4-digit number)
  const yearMatch = input.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
  }
  
  // Common make patterns
  const makePatterns = [
    "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", 
    "hyundai", "subaru", "mazda", "volkswagen", "vw", "bmw", 
    "mercedes", "audi", "lexus", "acura", "infiniti"
  ];
  
  for (const makeName of makePatterns) {
    if (input.includes(makeName)) {
      make = makeName === "chevy" ? "chevrolet" : makeName;
      break;
    }
  }
  
  // Find matching vehicle in our database
  const match = mockVehiclePrices.find(v => 
    (make && v.make.toLowerCase().includes(make)) &&
    Math.abs(v.year - year) <= 1
  );
  
  if (match) {
    return {
      make: match.make,
      model: match.model,
      year: match.year,
      estimatedValue: match.estimatedValue,
      isNew: match.isNew,
      confidence: "medium"
    };
  }
  
  // Fallback estimate based on year
  const avgPrice = year >= 2023 ? 30000 : year >= 2020 ? 25000 : 20000;
  
  return {
    make: make || "Unknown",
    model: model || "Unknown",
    year,
    estimatedValue: avgPrice,
    isNew: year >= new Date().getFullYear(),
    confidence: "low"
  };
};

export const estimateVehicleValue = (vehicleInfo: any) => {
  if (!vehicleInfo) return null;
  
  const { make, model, year, estimatedValue, isNew } = vehicleInfo;
  
  return {
    basePrice: estimatedValue,
    isNew,
    depreciation: isNew ? 0 : Math.floor((new Date().getFullYear() - year) * 0.15 * estimatedValue),
    finalEstimate: estimatedValue,
    confidence: vehicleInfo.confidence || "medium"
  };
};
