import React, { useState, useEffect, useRef } from 'react';
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
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { studentService, resultService } from '../services/api';
import * as XLSX from 'xlsx';

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
  const [editMode, setEditMode] = useState(false);
  const [currentDataType, setCurrentDataType] = useState('');
  const [gridApi, setGridApi] = useState(null);
  const [fileType, setFileType] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  const fileInputRef = useRef(null);

  // Default column configuration
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    editable: (params) => editMode,
    singleClickEdit: true,
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
    setEditMode(false);
    
    // Set appropriate data for the selected tab
    if (newValue === 0) {
      // CSV Upload tab - do nothing
      setCurrentDataType('');
    } else if (newValue === 1) {
      // Students tab
      setCurrentDataType('students');
      if (studentData.length > 0) {
        const columns = Object.keys(studentData[0]).map(key => ({
          headerName: key.replace(/_/g, ' ').toUpperCase(),
          field: key,
          editable: (params) => editMode && key !== 'id' && !['created_at', 'updated_at'].includes(key),
        }));
        setColumnDefs(columns);
        setData(studentData);
      }
    } else if (newValue === 2) {
      // Results tab
      setCurrentDataType('results');
      if (resultData.length > 0) {
        const columns = Object.keys(resultData[0]).map(key => ({
          headerName: key.replace(/_/g, ' ').toUpperCase(),
          field: key,
          editable: (params) => editMode && key !== 'id' && !['created_at', 'updated_at', 'percentage'].includes(key),
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
      // Get file extension
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      
      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
        setError(null);
        setFileType(fileExtension);
        setCustomFileName(selectedFile.name.split('.')[0]); // Set base name for download
        processFile(selectedFile, fileExtension);
      } else {
        setError('Please upload a CSV or Excel file (xlsx/xls)');
        setFile(null);
        setData([]);
        setColumnDefs([]);
      }
    }
  };

  const processFile = (file, fileType) => {
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (fileType === 'csv') {
          processCsvData(e.target.result);
        } else {
          // Excel file processing
          processExcelData(e.target.result);
        }
      } catch (error) {
        console.error(`Error parsing ${fileType.toUpperCase()} file:`, error);
        setError(`Error parsing ${fileType.toUpperCase()} file: ${error.message}`);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
    };
    
    if (fileType === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
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

  const processCsvData = (csvData) => {
    // Split by line breaks, handling different OS formats
    const rows = csvData.split(/\r?\n/);
    
    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Get headers from first row
    const headers = parseCSVLine(rows[0]);
    
    // Create column definitions dynamically based on headers
    const columnDefinitions = headers.map(header => {
      const fieldName = header.trim().replace(/^"|"$/g, '');
      // Try to determine if this is a numeric column based on name
      const isNumeric = /total|amount|number|price|cost|qty|quantity|sum|marks|percentage/i.test(fieldName);
      
      return {
        headerName: fieldName,
        field: fieldName,
        // Set numeric columns as numeric types
        ...(isNumeric ? { type: 'numericColumn' } : {})
      };
    });
    
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
  };

  const processExcelData = (arrayBuffer) => {
    // Use XLSX library to read Excel files
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with headers
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (excelData.length === 0) {
      throw new Error('Excel file is empty');
    }
    
    // Get headers from first row
    const headers = excelData[0];
    
    // Create column definitions dynamically based on headers
    const columnDefinitions = headers.map(header => {
      // Try to determine if this is a numeric column based on name
      const isNumeric = /total|amount|number|price|cost|qty|quantity|sum|marks|percentage/i.test(header);
      
      return {
        headerName: header,
        field: header,
        // Set numeric columns as numeric types
        ...(isNumeric ? { type: 'numericColumn' } : {})
      };
    });
    
    // Parse data rows
    const parsedData = [];
    for (let i = 1; i < excelData.length; i++) {
      if (!excelData[i] || excelData[i].length === 0) continue;
      
      const rowData = excelData[i];
      const rowObj = {};
      
      headers.forEach((header, index) => {
        rowObj[header] = rowData[index] !== undefined ? rowData[index] : '';
      });
      
      parsedData.push(rowObj);
    }
    
    setColumnDefs(columnDefinitions);
    setData(parsedData);
    setLoading(false);
  };

  const downloadFile = () => {
    if (data.length === 0) {
      setError('No data to download');
      return;
    }

    try {
      const fileName = customFileName || 'exported_data';
      let outputData;
      
      // Convert the data to Excel format
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      const exportType = fileType === 'csv' ? 'csv' : 'xlsx';
      const outputFileName = `${fileName}.${exportType}`;
      
      if (exportType === 'csv') {
        outputData = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([outputData], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, outputFileName);
      } else {
        outputData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([outputData], { type: 'application/octet-stream' });
        saveAs(blob, outputFileName);
      }
    } catch (error) {
      console.error('Error exporting file:', error);
      setError(`Error exporting file: ${error.message}`);
    }
  };
  
  const saveAs = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setData([]);
    setColumnDefs([]);
    setError(null);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
    
    // Update column definitions to reflect editability
    if (currentDataType === 'students') {
      const updatedColumns = columnDefs.map(col => ({
        ...col,
        editable: (!editMode ? 
          (params) => false : 
          (params) => col.field !== 'id' && !['created_at', 'updated_at'].includes(col.field))
      }));
      setColumnDefs(updatedColumns);
    } else if (currentDataType === 'results') {
      const updatedColumns = columnDefs.map(col => ({
        ...col,
        editable: (!editMode ? 
          (params) => false : 
          (params) => col.field !== 'id' && !['created_at', 'updated_at', 'percentage'].includes(col.field))
      }));
      setColumnDefs(updatedColumns);
    } else if (tabValue === 0 && data.length > 0) {
      // For uploaded files
      const updatedColumns = columnDefs.map(col => ({
        ...col,
        editable: !editMode ? false : true
      }));
      setColumnDefs(updatedColumns);
    }
  };

  const handleCellValueChanged = async (params) => {
    if (!editMode) return;
    
    try {
      if (tabValue === 0) {
        // Just update local data for uploaded files
        console.log('Cell value changed:', params.data);
      } else if (currentDataType === 'students') {
        const updatedData = { ...params.data };
        await studentService.update(updatedData.id, updatedData);
        console.log('Student updated successfully:', updatedData);
      } else if (currentDataType === 'results') {
        const updatedData = { ...params.data };
        await resultService.update(updatedData.id, updatedData);
        console.log('Result updated successfully:', updatedData);
      }
    } catch (error) {
      console.error(`Error updating ${currentDataType}:`, error);
      // Refresh to get the original data
      if (tabValue !== 0) {
        loadBackendData();
        
        if (currentDataType === 'students') {
          setData(studentData);
        } else if (currentDataType === 'results') {
          setData(resultData);
        }
      }
    }
  };

  const saveAllChanges = () => {
    setEditMode(false);
    if (tabValue !== 0) {
      loadBackendData();
      
      if (currentDataType === 'students') {
        setData(studentData);
      } else if (currentDataType === 'results') {
        setData(resultData);
      }
    }
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const renderEditButtons = () => {
    if (tabValue === 0 && data.length === 0) return null;
    
    return (
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color={editMode ? "success" : "secondary"}
          onClick={toggleEditMode}
          startIcon={editMode ? <SaveIcon /> : <EditIcon />}
        >
          {editMode ? "Exit Edit Mode" : "Enable Cell Editing"}
        </Button>
        {editMode && (
          <Button
            variant="contained"
            color="primary"
            onClick={saveAllChanges}
            startIcon={<SaveIcon />}
          >
            Save All Changes
          </Button>
        )}
        {tabValue === 0 && data.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={downloadFile}
            startIcon={<FileDownloadIcon />}
          >
            Download File
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Data Viewer
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="File Uploader" />
          <Tab label="Students Data" />
          <Tab label="Results Data" />
        </Tabs>
        
        {tabValue === 0 && (
          <>
            <Typography variant="body1" gutterBottom>
              Upload a CSV or Excel file (xlsx/xls) to view and edit its contents. Any file structure is supported.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <input
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                id="csv-file-upload"
                type="file"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <label htmlFor="csv-file-upload">
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Upload File
                </Button>
              </label>
              
              {file && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={resetFileInput}
                >
                  Clear File
                </Button>
              )}
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

            {renderEditButtons()}
          </>
        )}
        
        {tabValue === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Students Data ({studentData.length} records) {editMode && <span style={{ color: 'green', fontSize: '0.8em' }}>(Edit Mode Enabled - Click cells to edit)</span>}
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
            {renderEditButtons()}
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
                Results Data ({resultData.length} records) {editMode && <span style={{ color: 'green', fontSize: '0.8em' }}>(Edit Mode Enabled - Click cells to edit)</span>}
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
            {renderEditButtons()}
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
                onCellValueChanged={handleCellValueChanged}
                stopEditingWhenCellsLoseFocus={true}
                onGridReady={onGridReady}
                suppressClickEdit={!editMode}
                editType="fullRow"
              />
            </div>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default CsvViewer; 