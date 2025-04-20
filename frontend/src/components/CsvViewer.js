import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Container,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { studentService, resultService } from '../services/api';

function CsvViewer() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [studentData, setStudentData] = useState([]);
  const [resultData, setResultData] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);

  // Sample CSV data
  const sampleCsvData = `roll_number,name,class_name,subject,marks_obtained,total_marks,semester
STU001,John Doe,Class 10,Mathematics,85,100,Semester 1
STU001,John Doe,Class 10,Science,78,100,Semester 1
STU001,John Doe,Class 10,English,92,100,Semester 1
STU002,Jane Smith,Class 10,Mathematics,92,100,Semester 1
STU002,Jane Smith,Class 10,Science,88,100,Semester 1
STU002,Jane Smith,Class 10,English,95,100,Semester 1
STU003,Alex Johnson,Class 11,Mathematics,76,100,Semester 1
STU003,Alex Johnson,Class 11,Science,82,100,Semester 1
STU003,Alex Johnson,Class 11,English,89,100,Semester 1
STU004,Sarah Williams,Class 11,Mathematics,94,100,Semester 1
STU004,Sarah Williams,Class 11,Science,91,100,Semester 1
STU004,Sarah Williams,Class 11,English,87,100,Semester 1`;

  // Default column configuration
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  };

  useEffect(() => {
    // Load data when component mounts
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    setApiLoading(true);
    try {
      // Load students
      const students = await studentService.getAll();
      setStudentData(Array.isArray(students) ? students : []);
      
      // Load results
      const results = await resultService.getAll();
      setResultData(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error loading data from backend:', error);
    } finally {
      setApiLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Set appropriate data for the selected tab
    if (newValue === 0) {
      // CSV Upload tab - do nothing
    } else if (newValue === 1) {
      // Students tab
      if (studentData.length > 0) {
        const columns = Object.keys(studentData[0]).map(key => ({
          headerName: key.replace(/_/g, ' ').toUpperCase(),
          field: key,
        }));
        setColumnDefs(columns);
        setData(studentData);
      }
    } else if (newValue === 2) {
      // Results tab
      if (resultData.length > 0) {
        const columns = Object.keys(resultData[0]).map(key => ({
          headerName: key.replace(/_/g, ' ').toUpperCase(),
          field: key,
          ...(key.includes('marks') || key === 'percentage' ? { type: 'numericColumn' } : {})
        }));
        setColumnDefs(columns);
        setData(resultData);
      }
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check if file is CSV
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (fileType === 'csv') {
        setFile(selectedFile);
        setError(null);
        processFile(selectedFile);
      } else {
        setError('Please upload a CSV file');
        setFile(null);
        setData([]);
        setColumnDefs([]);
      }
    }
  };

  // Parse CSV line considering quoted values that might include commas
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  const processFile = (file) => {
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvData = e.target.result;
        // Split by line breaks, handling different OS formats
        const rows = csvData.split(/\r?\n/);
        
        if (rows.length === 0) {
          throw new Error('CSV file is empty');
        }
        
        // Get headers from first row
        const headers = parseCSVLine(rows[0]);
        
        // Create column definitions
        const columnDefinitions = headers.map(header => ({
          headerName: header.trim().replace(/^"|"$/g, ''),
          field: header.trim().replace(/^"|"$/g, ''),
          // Set numeric columns as numeric types
          ...(header.includes('marks') || header.includes('total') ? 
            { type: 'numericColumn' } : {})
        }));
        
        // Parse data rows
        const parsedData = [];
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim() === '') continue;
          
          const rowData = parseCSVLine(rows[i]);
          if (rowData.length !== headers.length) {
            console.warn(`Row ${i+1} has ${rowData.length} fields, expected ${headers.length}. Skipping.`);
            continue;
          }
          
          const rowObj = {};
          headers.forEach((header, index) => {
            const field = header.trim().replace(/^"|"$/g, '');
            let value = rowData[index]?.replace(/^"|"$/g, '') || '';
            
            // Try to convert numeric values
            if (!isNaN(value) && value !== '') {
              value = Number(value);
            }
            
            rowObj[field] = value;
          });
          
          parsedData.push(rowObj);
        }
        
        setColumnDefs(columnDefinitions);
        setData(parsedData);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setError(`Error parsing CSV file: ${error.message}`);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };

  const processSampleData = () => {
    // Create a Blob with the sample CSV data
    const blob = new Blob([sampleCsvData], { type: 'text/csv' });
    // Create a File object from the Blob
    const file = new File([blob], 'student_marks.csv', { type: 'text/csv' });
    
    setFile(file);
    processFile(file);
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_marks.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Data Viewer
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="CSV Upload" />
          <Tab label="Students Data" />
          <Tab label="Results Data" />
        </Tabs>
        
        {tabValue === 0 && (
          <>
            <Typography variant="body1" gutterBottom>
              Upload a CSV file to view its contents in a table format. You can also use our sample data.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="csv-file-upload">
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Upload CSV
                </Button>
              </label>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={downloadSampleCsv}
              >
                Download Sample CSV
              </Button>
              
              <Button
                variant="outlined"
                onClick={processSampleData}
              >
                Load Sample Data
              </Button>
            </Box>
            
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {file.name}
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </>
        )}
        
        {tabValue === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Students Data ({studentData.length} records)
              </Typography>
              <Button 
                startIcon={<RefreshIcon />}
                variant="outlined"
                onClick={loadBackendData}
                disabled={apiLoading}
              >
                Refresh Data
              </Button>
            </Box>
            {apiLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : studentData.length === 0 ? (
              <Alert severity="info">No student data available. Please import some data first.</Alert>
            ) : null}
          </>
        )}
        
        {tabValue === 2 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Results Data ({resultData.length} records)
              </Typography>
              <Button 
                startIcon={<RefreshIcon />}
                variant="outlined"
                onClick={loadBackendData}
                disabled={apiLoading}
              >
                Refresh Data
              </Button>
            </Box>
            {apiLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : resultData.length === 0 ? (
              <Alert severity="info">No result data available. Please import some data first.</Alert>
            ) : null}
          </>
        )}
        
        {data.length > 0 && !loading && !apiLoading && (
          <Box>
            <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
              <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
                pagination={true}
                paginationPageSize={10}
                rowSelection="multiple"
                enableCellTextSelection={true}
                ensureDomOrder={true}
              />
            </div>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default CsvViewer; 