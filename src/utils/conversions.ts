// utils/conversions.ts

// --- Unit Definitions ---

// Base unit: meter (m)
const lengthUnits: { [key: string]: number } = {
  m: 1, meter: 1, meters: 1,
  cm: 0.01, centimeter: 0.01, centimeters: 0.01,
  mm: 0.001, millimeter: 0.001, millimeters: 0.001,
  km: 1000, kilometer: 1000, kilometers: 1000,
  ft: 0.3048, foot: 0.3048, feet: 0.3048,
  in: 0.0254, inch: 0.0254, inches: 0.0254,
  mi: 1609.34, mile: 1609.34, miles: 1609.34,
  yd: 0.9144, yard: 0.9144, yards: 0.9144,
};

// Base unit: kilogram (kg)
const massUnits: { [key: string]: number } = {
  kg: 1, kilogram: 1, kilograms: 1,
  g: 0.001, gram: 0.001, grams: 0.001,
  mg: 0.000001, milligram: 0.000001, milligrams: 0.000001,
  lb: 0.453592, lbs: 0.453592, pound: 0.453592, pounds: 0.453592,
  oz: 0.0283495, ounce: 0.0283495, ounces: 0.0283495,
};

// Base unit: liter (l)
const volumeUnits: { [key: string]: number } = {
    l: 1, liter: 1, liters: 1,
    ml: 0.001, milliliter: 0.001, milliliters: 0.001,
    cup: 0.236588, cups: 0.236588,
    tsp: 0.00492892, teaspoon: 0.00492892, teaspoons: 0.00492892,
    tbsp: 0.0147868, tablespoon: 0.0147868, tablespoons: 0.0147868,
    floz: 0.0295735, 'fluid ounce': 0.0295735, 'fluid ounces': 0.0295735,
};

// --- Currency Definitions ---
// NOTE: These are static rates for demonstration. A real app would fetch these from an API.
// Base currency: USD
const currencyRates: { [key: string]: number } = {
  usd: 1, '$': 1, dollar: 1, dollars: 1,
  eur: 0.93, '€': 0.93, euro: 0.93, euros: 0.93,
  gbp: 0.79, '£': 0.79, pound: 0.79, pounds: 0.79, // Note: conflicts with mass 'pound' so category check is important
  jpy: 157.5, '¥': 157.5, yen: 157.5,
  cad: 1.37, 'canadian dollar': 1.37,
  aud: 1.50, 'australian dollar': 1.50,
  cny: 7.25, yuan: 7.25,
  inr: 83.5, rupee: 83.5, rupees: 83.5,
};

const unitCategories = [
  { name: 'length', units: lengthUnits },
  { name: 'mass', units: massUnits },
  { name: 'volume', units: volumeUnits },
  { name: 'currency', units: currencyRates, isCurrency: true },
];

const conversionRegex = /^(\d*\.?\d+)\s*([a-zA-Z$€£¥]+)\s+(?:to|in)\s+([a-zA-Z$€£¥]+)$/i;

export const performConversion = (query: string): string | null => {
  const match = query.trim().match(conversionRegex);
  if (!match) return null;

  const [, amountStr, fromUnitRaw, toUnitRaw] = match;
  const amount = parseFloat(amountStr);
  const fromUnit = fromUnitRaw.toLowerCase();
  const toUnit = toUnitRaw.toLowerCase();

  let fromCategory, toCategory;
  let fromFactor, toFactor;

  for (const category of unitCategories) {
    if (fromUnit in category.units) {
      fromCategory = category;
      fromFactor = category.units[fromUnit];
    }
    if (toUnit in category.units) {
      toCategory = category;
      toFactor = category.units[toUnit];
    }
  }
  
  // Handle ambiguous units like 'pound' by checking if both units are currencies
  if(fromUnit === 'pound' || fromUnit === 'pounds' || toUnit === 'pound' || toUnit === 'pounds'){
      const fromIsCurrency = fromUnit in currencyRates;
      const toIsCurrency = toUnit in currencyRates;
      if (fromIsCurrency && toIsCurrency) {
          fromCategory = unitCategories.find(c => c.name === 'currency');
          toCategory = fromCategory;
          fromFactor = fromCategory!.units[fromUnit];
          toFactor = fromCategory!.units[toUnit];
      }
  }


  if (!fromCategory || !toCategory || fromFactor === undefined || toFactor === undefined) {
    return "Error: Unknown unit";
  }

  if (fromCategory.name !== toCategory.name) {
    return "Error: Cannot convert between different unit types";
  }
  
  let result;
  if (fromCategory.isCurrency) {
      // Convert from 'fromUnit' to base (USD), then from base to 'toUnit'
      const amountInBase = amount / fromFactor;
      result = amountInBase * toFactor;
  } else {
      // Convert from 'fromUnit' to base unit, then from base to 'toUnit'
      const amountInBase = amount * fromFactor;
      result = amountInBase / toFactor;
  }

  const resultString = Number(result.toPrecision(6)).toString();

  return `${resultString} ${toUnitRaw.toUpperCase()}`;
};
