import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

function ExcelAnalyzer() {
  const [fileStructure, setFileStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyzeExcelFile();
  }, []);

  const analyzeExcelFile = async () => {
    try {
      setLoading(true);
      // Path to the sample file 
      const filePath = '/backend/sample_student_data.xlsx';
      
      // Fetch the file
      const response = await fetch(filePath);
      const blob = await response.blob();
      
      // Read the Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // First row contains headers
          const headers = jsonData[0];
          
          // Log the structure
          console.log('Excel Headers:', headers);
          console.log('Sample Data:', jsonData.slice(1, 3));
          
          setFileStructure({
            headers,
            sampleData: jsonData.slice(1, 3),
            totalRows: jsonData.length - 1
          });
        } catch (err) {
          console.error('Error processing Excel file:', err);
          setError('Failed to process Excel file');
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      console.error('Error fetching Excel file:', err);
      setError('Failed to fetch Excel file');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading file structure...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!fileStructure) return <div>No file structure available</div>;

  return (
    <div>
      <h3>Excel File Structure</h3>
      <p>Total Rows: {fileStructure.totalRows}</p>
      <h4>Headers:</h4>
      <ul>
        {fileStructure.headers.map((header, index) => (
          <li key={index}>{header}</li>
        ))}
      </ul>
      <h4>Sample Data:</h4>
      <pre>{JSON.stringify(fileStructure.sampleData, null, 2)}</pre>
    </div>
  );
}

export default ExcelAnalyzer; 