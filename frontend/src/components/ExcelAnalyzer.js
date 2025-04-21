import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button, Typography, Box, Container, Paper, Alert, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function ExcelAnalyzer() {
  const [fileStructure, setFileStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
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
          totalRows: jsonData.length - 1,
          fileName: file.name
        });
      } catch (err) {
        console.error('Error processing Excel file:', err);
        setError('Failed to process Excel file: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Excel File Analyzer
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
        >
          Upload Excel File
          <input
            type="file"
            accept=".xlsx, .xls"
            hidden
            onChange={handleFileUpload}
          />
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !fileStructure ? (
          <Alert severity="info">Please upload an Excel file to analyze its structure</Alert>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              File Structure: {fileStructure.fileName}
            </Typography>
            <Typography>Total Rows: {fileStructure.totalRows}</Typography>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Headers:</Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              {fileStructure.headers.map((header, index) => (
                <li key={index}>{header}</li>
              ))}
            </Box>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Sample Data:</Typography>
            <Box component="pre" sx={{ 
              overflowX: 'auto', 
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontSize: '0.9rem'
            }}>
              {JSON.stringify(fileStructure.sampleData, null, 2)}
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default ExcelAnalyzer; 