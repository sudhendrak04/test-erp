import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Paper,
  Alert,
  Input,
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';

function StudentDataViewer() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [changed, setChanged] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('No data found in the uploaded file');
          setLoading(false);
          return;
        }
        
        // Create column definitions based on the uploaded data
        const columns = Object.keys(jsonData[0]).map(key => ({
          headerName: key,
          field: key,
          sortable: true,
          filter: true,
          editable: params => editMode,
          // Try to detect numeric columns
          ...(typeof jsonData[0][key] === 'number' ? { type: 'numericColumn' } : {}),
        }));
        
        setColumnDefs(columns);
        setData(jsonData);
        setOriginalData(JSON.parse(JSON.stringify(jsonData)));
        setFileUploaded(true);
        setError(null);
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

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    singleClickEdit: true,
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
  };

  const handleCellValueChanged = (params) => {
    console.log('Cell value changed:', params.data);
    setChanged(true);
  };

  const handleSaveChanges = () => {
    // Export modified data to Excel
    exportToExcel();
    setEditMode(false);
    setChanged(false);
  };

  const handleResetChanges = () => {
    // Reset to original data
    setData([...originalData]);
    setChanged(false);
    setEditMode(false);
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
  };

  const exportToExcel = () => {
    try {
      // Create a worksheet from the current data
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Create a workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, 'updated_student_data.xlsx');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError(`Failed to export to Excel: ${err.message}`);
    }
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Student Data Viewer
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
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
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {fileUploaded && (
            <>
              <Button
                variant="contained"
                color={editMode ? "success" : "secondary"}
                onClick={toggleEditMode}
                startIcon={editMode ? <SaveIcon /> : <EditIcon />}
              >
                {editMode ? "Exit Edit Mode" : "Enable Cell Editing"}
              </Button>
              {editMode && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveChanges}
                    startIcon={<SaveIcon />}
                    disabled={!changed}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleResetChanges}
                  >
                    Reset Changes
                  </Button>
                </>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={exportToExcel}
                startIcon={<FileDownloadIcon />}
                disabled={data.length === 0}
              >
                Download Excel
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {fileUploaded ? (
            <>
              Student Data {editMode && <span style={{ color: 'green', fontSize: '0.8em' }}>(Edit Mode Enabled - Click cells to edit)</span>}
              {changed && <span style={{ color: 'orange', fontSize: '0.8em', marginLeft: '10px' }}>(Unsaved Changes)</span>}
            </>
          ) : (
            <>Please upload an Excel file to view student data</>
          )}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !fileUploaded ? (
          <Alert severity="info">
            No file uploaded yet. Please upload an Excel file with student data.
          </Alert>
        ) : data.length === 0 ? (
          <Alert severity="info">
            No student data found in the uploaded file.
          </Alert>
        ) : (
          <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={data}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              pagination={true}
              paginationPageSize={10}
              onGridReady={onGridReady}
              onCellValueChanged={handleCellValueChanged}
            />
          </div>
        )}
      </Paper>
    </Container>
  );
}

export default StudentDataViewer; 