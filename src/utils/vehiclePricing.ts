
// Enhanced vehicle pricing data with more comprehensive coverage
interface VehiclePrice {
  make: string;
  model: string;
  year: number;
  estimatedValue: number;
  isNew: boolean;
}

const mockVehiclePrices: VehiclePrice[] = [
  // Toyota
  { make: "Toyota", model: "Camry", year: 2024, estimatedValue: 28500, isNew: true },
  { make: "Toyota", model: "Camry", year: 2023, estimatedValue: 26000, isNew: false },
  { make: "Toyota", model: "Camry", year: 2022, estimatedValue: 24000, isNew: false },
  { make: "Toyota", model: "RAV4", year: 2024, estimatedValue: 32500, isNew: true },
  { make: "Toyota", model: "RAV4", year: 2023, estimatedValue: 30000, isNew: false },
  { make: "Toyota", model: "Corolla", year: 2024, estimatedValue: 24500, isNew: true },
  { make: "Toyota", model: "Corolla", year: 2023, estimatedValue: 22000, isNew: false },
  { make: "Toyota", model: "Highlander", year: 2024, estimatedValue: 38000, isNew: true },
  { make: "Toyota", model: "Prius", year: 2024, estimatedValue: 29000, isNew: true },
  
  // Honda
  { make: "Honda", model: "Civic", year: 2024, estimatedValue: 25500, isNew: true },
  { make: "Honda", model: "Civic", year: 2023, estimatedValue: 23500, isNew: false },
  { make: "Honda", model: "Accord", year: 2024, estimatedValue: 30500, isNew: true },
  { make: "Honda", model: "Accord", year: 2023, estimatedValue: 28000, isNew: false },
  { make: "Honda", model: "CR-V", year: 2024, estimatedValue: 33000, isNew: true },
  { make: "Honda", model: "CR-V", year: 2023, estimatedValue: 30500, isNew: false },
  { make: "Honda", model: "Pilot", year: 2024, estimatedValue: 40000, isNew: true },
  
  // Ford
  { make: "Ford", model: "F-150", year: 2024, estimatedValue: 38500, isNew: true },
  { make: "Ford", model: "F-150", year: 2023, estimatedValue: 36000, isNew: false },
  { make: "Ford", model: "Escape", year: 2024, estimatedValue: 28000, isNew: true },
  { make: "Ford", model: "Mustang", year: 2024, estimatedValue: 35000, isNew: true },
  { make: "Ford", model: "Explorer", year: 2024, estimatedValue: 37000, isNew: true },
  
  // Chevrolet
  { make: "Chevrolet", model: "Equinox", year: 2024, estimatedValue: 29500, isNew: true },
  { make: "Chevrolet", model: "Silverado", year: 2024, estimatedValue: 40000, isNew: true },
  { make: "Chevrolet", model: "Malibu", year: 2024, estimatedValue: 26000, isNew: true },
  { make: "Chevrolet", model: "Tahoe", year: 2024, estimatedValue: 55000, isNew: true },
  
  // Nissan
  { make: "Nissan", model: "Altima", year: 2024, estimatedValue: 26500, isNew: true },
  { make: "Nissan", model: "Altima", year: 2023, estimatedValue: 24000, isNew: false },
  { make: "Nissan", model: "Rogue", year: 2024, estimatedValue: 30000, isNew: true },
  { make: "Nissan", model: "Sentra", year: 2024, estimatedValue: 21500, isNew: true },
  
  // Hyundai
  { make: "Hyundai", model: "Elantra", year: 2024, estimatedValue: 23500, isNew: true },
  { make: "Hyundai", model: "Tucson", year: 2024, estimatedValue: 29000, isNew: true },
  { make: "Hyundai", model: "Santa Fe", year: 2024, estimatedValue: 35000, isNew: true },
  
  // Subaru
  { make: "Subaru", model: "Outback", year: 2024, estimatedValue: 31500, isNew: true },
  { make: "Subaru", model: "Forester", year: 2024, estimatedValue: 29500, isNew: true },
  
  // BMW
  { make: "BMW", model: "3 Series", year: 2024, estimatedValue: 42000, isNew: true },
  { make: "BMW", model: "X3", year: 2024, estimatedValue: 45000, isNew: true },
  
  // Mercedes
  { make: "Mercedes", model: "C-Class", year: 2024, estimatedValue: 45000, isNew: true },
  
  // Audi
  { make: "Audi", model: "A4", year: 2024, estimatedValue: 43000, isNew: true },
];

export const parseVehicleInfo = (vinOrModel: string) => {
  if (!vinOrModel) return null;
  
  const input = vinOrModel.toLowerCase().trim();
  console.log('Parsing vehicle input:', input);
  
  // Check if it's a VIN (17 characters, alphanumeric)
  if (input.length === 17 && /^[a-z0-9]+$/i.test(input)) {
    // Mock VIN decoding - in production would call real VIN API
    return {
      make: "Toyota",
      model: "Camry",
      year: 2023,
      estimatedValue: 26000,
      isNew: false,
      confidence: "high"
    };
  }
  
  // Enhanced parsing logic for make/model/year
  const words = input.split(/\s+/);
  let year = new Date().getFullYear(); // Default to current year
  let make = "";
  let model = "";
  
  // Look for year (4-digit number between 1990-2025)
  const yearMatch = input.match(/\b(19[9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
  }
  
  // Enhanced make detection with common variations
  const makePatterns = {
    "toyota": ["toyota"],
    "honda": ["honda"],
    "ford": ["ford"],
    "chevrolet": ["chevrolet", "chevy", "chev"],
    "nissan": ["nissan"],
    "hyundai": ["hyundai"],
    "subaru": ["subaru"],
    "mazda": ["mazda"],
    "volkswagen": ["volkswagen", "vw"],
    "bmw": ["bmw"],
    "mercedes": ["mercedes", "mercedes-benz", "benz"],
    "audi": ["audi"],
    "lexus": ["lexus"],
    "acura": ["acura"],
    "infiniti": ["infiniti"],
    "kia": ["kia"],
    "jeep": ["jeep"],
    "ram": ["ram"],
    "gmc": ["gmc"]
  };
  
  // Find make
  for (const [standardMake, variations] of Object.entries(makePatterns)) {
    for (const variation of variations) {
      if (input.includes(variation)) {
        make = standardMake.charAt(0).toUpperCase() + standardMake.slice(1);
        if (standardMake === "chevrolet") make = "Chevrolet";
        if (standardMake === "mercedes") make = "Mercedes";
        break;
      }
    }
    if (make) break;
  }
  
  // Enhanced model detection
  const modelPatterns = {
    "camry": ["camry"],
    "corolla": ["corolla"],
    "rav4": ["rav4", "rav-4"],
    "highlander": ["highlander"],
    "prius": ["prius"],
    "civic": ["civic"],
    "accord": ["accord"],
    "cr-v": ["cr-v", "crv"],
    "pilot": ["pilot"],
    "f-150": ["f-150", "f150", "f 150"],
    "escape": ["escape"],
    "mustang": ["mustang"],
    "explorer": ["explorer"],
    "equinox": ["equinox"],
    "silverado": ["silverado"],
    "malibu": ["malibu"],
    "tahoe": ["tahoe"],
    "altima": ["altima"],
    "rogue": ["rogue"],
    "sentra": ["sentra"],
    "elantra": ["elantra"],
    "tucson": ["tucson"],
    "santa fe": ["santa fe", "santafe"],
    "outback": ["outback"],
    "forester": ["forester"],
    "3 series": ["3 series", "3-series", "320i", "330i"],
    "x3": ["x3"],
    "c-class": ["c-class", "c class", "c300", "c350"],
    "a4": ["a4"]
  };
  
  for (const [standardModel, variations] of Object.entries(modelPatterns)) {
    for (const variation of variations) {
      if (input.includes(variation)) {
        model = standardModel;
        break;
      }
    }
    if (model) break;
  }
  
  console.log('Parsed vehicle:', { make, model, year });
  
  // Find exact match in our database
  let match = mockVehiclePrices.find(v => 
    v.make.toLowerCase() === make.toLowerCase() &&
    v.model.toLowerCase() === model.toLowerCase() &&
    v.year === year
  );
  
  // If no exact match, try to find close match by make and model with different year
  if (!match && make && model) {
    match = mockVehiclePrices.find(v => 
      v.make.toLowerCase() === make.toLowerCase() &&
      v.model.toLowerCase() === model.toLowerCase()
    );
    
    if (match) {
      // Adjust price based on year difference
      const yearDiff = year - match.year;
      const adjustedPrice = match.estimatedValue - (yearDiff * 1500); // $1500 depreciation per year
      match = {
        ...match,
        year,
        estimatedValue: Math.max(adjustedPrice, match.estimatedValue * 0.6) // Don't go below 60% of original
      };
    }
  }
  
  if (match) {
    return {
      make: match.make,
      model: match.model,
      year: match.year,
      estimatedValue: match.estimatedValue,
      isNew: match.isNew,
      confidence: "high"
    };
  }
  
  // Fallback estimate based on make and year
  const makeMultipliers = {
    "toyota": 1.0,
    "honda": 1.0,
    "ford": 0.9,
    "chevrolet": 0.9,
    "nissan": 0.85,
    "hyundai": 0.8,
    "subaru": 0.95,
    "bmw": 1.6,
    "mercedes": 1.7,
    "audi": 1.5,
    "lexus": 1.3
  };
  
  const basePrice = year >= 2023 ? 30000 : year >= 2020 ? 25000 : year >= 2015 ? 20000 : 15000;
  const multiplier = makeMultipliers[make.toLowerCase()] || 1.0;
  const estimatedPrice = Math.round(basePrice * multiplier);
  
  return {
    make: make || "Unknown",
    model: model || "Unknown",
    year,
    estimatedValue: estimatedPrice,
    isNew: year >= new Date().getFullYear(),
    confidence: make && model ? "medium" : "low"
  };
};

export const estimateVehicleValue = (vehicleInfo: any) => {
  if (!vehicleInfo) return null;
  
  const { make, model, year, estimatedValue, isNew } = vehicleInfo;
  
  return {
    basePrice: estimatedValue,
    isNew,
    depreciation: isNew ? 0 : Math.floor((new Date().getFullYear() - year) * 0.12 * estimatedValue),
    finalEstimate: estimatedValue,
    confidence: vehicleInfo.confidence || "medium"
  };
};
