import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';

function StudentDataViewer() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    // Define dummy data with the exact columns from sample_student_data.xlsx
    const sampleData = [
      {
        "S.No": 1,
        "Roll Number": "STU001",
        "Name": "John Doe",
        "Date of Birth": "2001-05-15",
        "Gender": "Male",
        "Email": "john.doe@example.com",
        "Phone": "1234567890",
        "Address": "123 Main St, City",
        "Department": "Computer Science",
        "Batch": "2022-2026",
        "CGPA": 8.5
      },
      {
        "S.No": 2,
        "Roll Number": "STU002",
        "Name": "Jane Smith",
        "Date of Birth": "2002-07-20",
        "Gender": "Female",
        "Email": "jane.smith@example.com",
        "Phone": "9876543210",
        "Address": "456 Park Ave, Town",
        "Department": "Electrical Engineering",
        "Batch": "2022-2026",
        "CGPA": 9.2
      },
      {
        "S.No": 3,
        "Roll Number": "STU003",
        "Name": "Alex Johnson",
        "Date of Birth": "2001-11-03",
        "Gender": "Male",
        "Email": "alex.j@example.com",
        "Phone": "5551234567",
        "Address": "789 Oak Dr, Village",
        "Department": "Mechanical Engineering",
        "Batch": "2022-2026",
        "CGPA": 7.8
      },
      {
        "S.No": 4,
        "Roll Number": "STU004",
        "Name": "Sarah Williams",
        "Date of Birth": "2002-03-27",
        "Gender": "Female",
        "Email": "sarah.w@example.com",
        "Phone": "4567891230",
        "Address": "321 Pine St, County",
        "Department": "Information Technology",
        "Batch": "2022-2026",
        "CGPA": 8.9
      },
      {
        "S.No": 5,
        "Roll Number": "STU005",
        "Name": "Michael Brown",
        "Date of Birth": "2001-09-12",
        "Gender": "Male",
        "Email": "michael.b@example.com",
        "Phone": "7891234560",
        "Address": "654 Elm St, District",
        "Department": "Civil Engineering",
        "Batch": "2022-2026",
        "CGPA": 8.3
      }
    ];

    // Create column definitions based on the sample data
    const columns = Object.keys(sampleData[0]).map(key => ({
      headerName: key,
      field: key,
      sortable: true,
      filter: true,
      editable: params => editMode,
      // Set numeric type for number columns
      ...(["S.No", "CGPA"].includes(key) ? { type: 'numericColumn' } : {}),
      // Set width for certain columns
      ...(key === "S.No" ? { width: 80, maxWidth: 100 } : {}),
      ...(key === "Roll Number" ? { width: 150 } : {}),
      ...(key === "Name" ? { width: 200 } : {}),
      ...(key === "Address" ? { minWidth: 250 } : {}),
    }));
    
    setColumnDefs(columns);
    setData(sampleData);
    setOriginalData(JSON.parse(JSON.stringify(sampleData)));
    setLoading(false);
  }, []);

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
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
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
        >
          Download Excel
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Student Data {editMode && <span style={{ color: 'green', fontSize: '0.8em' }}>(Edit Mode Enabled - Click cells to edit)</span>}
          {changed && <span style={{ color: 'orange', fontSize: '0.8em', marginLeft: '10px' }}>(Unsaved Changes)</span>}
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
        ) : data.length === 0 ? (
          <Alert severity="info">
            No student data found.
          </Alert>
        ) : (
          <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
            <AgGridReact
              rowData={data}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              pagination={true}
              paginationPageSize={15}
              onCellValueChanged={handleCellValueChanged}
              stopEditingWhenCellsLoseFocus={true}
              onGridReady={onGridReady}
              suppressClickEdit={!editMode}
              editType="fullRow"
            />
          </div>
        )}
      </Paper>
    </Container>
  );
}

export default StudentDataViewer; 