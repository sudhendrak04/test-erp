import * as XLSX from 'xlsx';

// Utility function to read Excel file and return its structure
export const readExcelFile = async (filePath) => {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const result = {};
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // First row contains headers
      const headers = jsonData[0];
      const data = jsonData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      
      result[sheetName] = {
        headers,
        data
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
};

export default readExcelFile; 