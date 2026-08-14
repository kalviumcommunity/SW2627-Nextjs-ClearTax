const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../sample_data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const vendors = ['Acme Corp', 'Globex', 'Initech', 'Soylent Corp', 'Massive Dynamic', 'Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems'];

function generateCSV(numRows, filename) {
  const filePath = path.join(dataDir, filename);
  const stream = fs.createWriteStream(filePath);
  
  stream.write('Invoice Number,Vendor,Amount\n');
  
  for (let i = 1; i <= numRows; i++) {
    const invNumber = `INV-${i.toString().padStart(6, '0')}`;
    let vendor = vendors[Math.floor(Math.random() * vendors.length)];
    let amount = (Math.random() * 1000 + 10).toFixed(2);
    
    // Inject some deliberate errors for testing Validation/Mismatches
    if (Math.random() < 0.05) {
      amount = (Math.random() * -500).toFixed(2); // Negative amount error
    }
    if (Math.random() < 0.05) {
      vendor = ''; // Missing vendor error
    }
    
    stream.write(`${invNumber},${vendor},${amount}\n`);
  }
  
  stream.end();
  console.log(`Generated ${filename} with ${numRows} rows.`);
}

generateCSV(100, 'batch_100_invoices.csv');
generateCSV(1000, 'batch_1000_invoices.csv');
generateCSV(5000, 'batch_5000_invoices.csv');
generateCSV(10000, 'batch_10000_invoices.csv');
