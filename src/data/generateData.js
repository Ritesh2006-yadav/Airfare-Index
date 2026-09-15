// Script to generate comprehensive rawAirfareData.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AIRLINES_LIST = [
  { name: 'IndiGo', code: '6E', factor: 0.96, stopsWeight: [0.75, 0.22, 0.03] },
  { name: 'Air India', code: 'AI', factor: 1.05, stopsWeight: [0.60, 0.35, 0.05] },
  { name: 'Vistara', code: 'UK', factor: 1.08, stopsWeight: [0.70, 0.28, 0.02] },
  { name: 'Akasa Air', code: 'QP', factor: 0.93, stopsWeight: [0.80, 0.20, 0.00] },
  { name: 'SpiceJet', code: 'SG', factor: 0.95, stopsWeight: [0.65, 0.30, 0.05] },
  { name: 'AIX Connect', code: 'IX', factor: 0.94, stopsWeight: [0.70, 0.28, 0.02] },
];

const ROUTES_CONFIG = [
  { source: 'Delhi', dest: 'Mumbai', srcCode: 'DEL', dstCode: 'BOM', basePrice: 4700, distanceKm: 1150 },
  { source: 'Mumbai', dest: 'Delhi', srcCode: 'BOM', dstCode: 'DEL', basePrice: 4700, distanceKm: 1150 },
  { source: 'Delhi', dest: 'Bengaluru', srcCode: 'DEL', dstCode: 'BLR', basePrice: 5200, distanceKm: 1740 },
  { source: 'Bengaluru', dest: 'Delhi', srcCode: 'BLR', dstCode: 'DEL', basePrice: 5200, distanceKm: 1740 },
  { source: 'Mumbai', dest: 'Bengaluru', srcCode: 'BOM', dstCode: 'BLR', basePrice: 3900, distanceKm: 840 },
  { source: 'Bengaluru', dest: 'Mumbai', srcCode: 'BLR', dstCode: 'BOM', basePrice: 3900, distanceKm: 840 },
  { source: 'Delhi', dest: 'Hyderabad', srcCode: 'DEL', dstCode: 'HYD', basePrice: 4600, distanceKm: 1250 },
  { source: 'Hyderabad', dest: 'Delhi', srcCode: 'HYD', dstCode: 'DEL', basePrice: 4600, distanceKm: 1250 },
  { source: 'Delhi', dest: 'Chennai', srcCode: 'DEL', dstCode: 'MAA', basePrice: 5400, distanceKm: 1760 },
  { source: 'Chennai', dest: 'Delhi', srcCode: 'MAA', dstCode: 'DEL', basePrice: 5400, distanceKm: 1760 },
  { source: 'Kolkata', dest: 'Delhi', srcCode: 'CCU', dstCode: 'DEL', basePrice: 4900, distanceKm: 1300 },
  { source: 'Delhi', dest: 'Kolkata', srcCode: 'DEL', dstCode: 'CCU', basePrice: 4900, distanceKm: 1300 },
  { source: 'Mumbai', dest: 'Goa', srcCode: 'BOM', dstCode: 'GOI', basePrice: 3400, distanceKm: 440 },
  { source: 'Goa', dest: 'Mumbai', srcCode: 'GOI', dstCode: 'BOM', basePrice: 3400, distanceKm: 440 },
  { source: 'Bengaluru', dest: 'Hyderabad', srcCode: 'BLR', dstCode: 'HYD', basePrice: 3200, distanceKm: 500 },
  { source: 'Hyderabad', dest: 'Bengaluru', srcCode: 'HYD', dstCode: 'BLR', basePrice: 3200, distanceKm: 500 },
  { source: 'Delhi', dest: 'Ahmedabad', srcCode: 'DEL', dstCode: 'AMD', basePrice: 3800, distanceKm: 770 },
  { source: 'Ahmedabad', dest: 'Delhi', srcCode: 'AMD', dstCode: 'DEL', basePrice: 3800, distanceKm: 770 },
  { source: 'Delhi', dest: 'Pune', srcCode: 'DEL', dstCode: 'PNQ', basePrice: 4500, distanceKm: 1170 },
  { source: 'Delhi', dest: 'Kochi', srcCode: 'DEL', dstCode: 'COK', basePrice: 6100, distanceKm: 2050 },
];

const MONTHS = [
  { name: 'January', num: '01', indexMultiplier: 1.08 },
  { name: 'February', num: '02', indexMultiplier: 1.04 },
  { name: 'March', num: '03', indexMultiplier: 1.12 }, // Holi / financial year end
  { name: 'April', num: '04', indexMultiplier: 1.10 },
  { name: 'May', num: '05', indexMultiplier: 1.22 }, // Summer peak
  { name: 'June', num: '06', indexMultiplier: 1.18 }, // School holidays
  { name: 'July', num: '07', indexMultiplier: 1.02 }, // Monsoon low
  { name: 'August', num: '08', indexMultiplier: 1.09 }, // Independence Day & Raksha Bandhan
  { name: 'September', num: '09', indexMultiplier: 1.174 }, // Current reporting period (117.4 Index!)
];

const LEAD_TIMES = [
  { days: 30, multiplier: 0.82 },
  { days: 21, multiplier: 0.89 },
  { days: 15, multiplier: 0.94 },
  { days: 7, multiplier: 1.12 },
  { days: 3, multiplier: 1.35 },
  { days: 1, multiplier: 1.62 },
];

function generateDataset() {
  const records = [];
  let idCounter = 1;

  for (const route of ROUTES_CONFIG) {
    for (const month of MONTHS) {
      // 8 to 14 records per route per month
      for (const airline of AIRLINES_LIST) {
        // Stopover determination
        const stopRand = Math.random();
        let totalStops = 0;
        let stopsLabel = 'non-stop';
        if (stopRand > airline.stopsWeight[0] + airline.stopsWeight[1]) {
          totalStops = 2;
          stopsLabel = '2 stops';
        } else if (stopRand > airline.stopsWeight[0]) {
          totalStops = 1;
          stopsLabel = '1 stop';
        }

        // Random lead time sample
        const leadTime = LEAD_TIMES[Math.floor(Math.random() * LEAD_TIMES.length)];
        
        // Stops price impact: non-stops usually slightly higher demand/price on business routes, or 1-stop lower
        const stopMultiplier = totalStops === 0 ? 1.0 : (totalStops === 1 ? 0.92 : 0.85);
        
        // Random daily variance (+- 7%)
        const noise = 0.93 + (Math.random() * 0.14);

        // Calculate price
        const calcPrice = Math.round(
          route.basePrice *
          month.indexMultiplier *
          airline.factor *
          stopMultiplier *
          noise
        );

        // Ensure price is rounded to 10s
        const finalPrice = Math.round(calcPrice / 10) * 10;
        const recordIndex = Number(((finalPrice / route.basePrice) * 100).toFixed(1));

        const dayNum = Math.floor(Math.random() * 26) + 1;
        const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
        const dateStr = `2026-${month.num}-${dayStr}`;

        records.push({
          id: `FL-${String(idCounter++).padStart(5, '0')}`,
          Airline: airline.name,
          Airline_Code: airline.code,
          Source: route.source,
          Source_Code: route.srcCode,
          Destination: route.dest,
          Destination_Code: route.dstCode,
          Route: `${route.srcCode} → ${route.dstCode}`,
          Distance_Km: route.distanceKm,
          Base_Price: route.basePrice,
          Price: finalPrice,
          Airfare_Index: recordIndex,
          Date_of_Journey: dateStr,
          Journey_Month: month.name,
          Month_Num: month.num,
          Total_Stops: totalStops,
          Stops_Label: stopsLabel,
          Days_Before_Travel: leadTime.days,
        });
      }
    }
  }

  const outputPath = path.join(__dirname, 'rawAirfareData.json');
  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8');
  console.log(`Generated ${records.length} airfare records at ${outputPath}`);
}

generateDataset();
