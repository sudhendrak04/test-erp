import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { studentService } from '../services/api';
import FileUpload from './FileUpload';
import * as XLSX from 'xlsx';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [columnDefs, setColumnDefs] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Original backend-based column definitions
  const defaultColumnDefs = [
    { headerName: 'ID', field: 'id', sortable: true, filter: true, editable: false },
    { 
      headerName: 'ROLL NO', 
      field: 'roll_no', 
      sortable: true, 
      filter: true, 
      editable: (params) => editMode
    },
    { 
      headerName: 'NAME', 
      field: 'name', 
      sortable: true, 
      filter: true, 
      editable: (params) => editMode
    },
    { 
      headerName: 'DATE OF BIRTH', 
      field: 'date_of_birth', 
      sortable: true, 
      filter: true, 
      editable: (params) => editMode
    },
    { 
      headerName: 'PHONE', 
      field: 'phone', 
      sortable: true, 
      filter: true, 
      editable: (params) => editMode
    },
    { 
      headerName: 'EMAIL', 
      field: 'email', 
      sortable: true, 
      filter: true, 
      editable: (params) => editMode
    },
    {
      headerName: 'Actions',
      field: 'id',
      sortable: false,
      filter: false,
      width: 120,
      editable: false,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex' }}>
          <Button
            size="small"
            color="primary"
            onClick={() => navigate(`/students/${params.value}/edit`)}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.value)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ];

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    singleClickEdit: true,
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getAll();
      console.log('Fetched students:', data);
      setStudents(Array.isArray(data) ? data : []);
      
      // If no custom columns are set, use the default ones based on backend data
      if (columnDefs.length === 0) {
        setColumnDefs(defaultColumnDefs);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentService.delete(id);
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleUploadComplete = () => {
    fetchStudents();
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
  };

  const handleCellValueChanged = async (params) => {
    if (!editMode) return;
    
    try {
      const updatedStudent = { ...params.data };
      await studentService.update(updatedStudent.id, updatedStudent);
      console.log('Student updated successfully:', updatedStudent);
    } catch (error) {
      console.error('Error updating student:', error);
      // Refresh to get the original data
      fetchStudents();
    }
  };

  const handleSaveAll = async () => {
    setEditMode(false);
    // Refresh data after save
    fetchStudents();
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const handleExcelFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setExcelFile(file);
      readExcelFile(file);
    }
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          
          // Create dynamic columns based on Excel headers
          const cols = Object.keys(firstRow).map(key => ({
            headerName: key,
            field: key,
            sortable: true,
            filter: true,
            editable: (params) => editMode,
            // Auto-detect numeric columns
            ...(typeof firstRow[key] === 'number' ? { type: 'numericColumn' } : {})
          }));
          
          // Add the actions column
          cols.push({
            headerName: 'Actions',
            field: 'id',
            sortable: false,
            filter: false,
            width: 120,
            editable: false,
            cellRenderer: (params) => (
              <Box sx={{ display: 'flex' }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate(`/students/${params.value}/edit`)}
                >
                  <EditIcon fontSize="small" />
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDelete(params.value)}
                >
                  <DeleteIcon fontSize="small" />
                </Button>
              </Box>
            )
          });
          
          // Set the new column definitions
          setColumnDefs(cols);
          
          // Map IDs from the backend data to the Excel rows
          if (students.length > 0) {
            const dataWithIds = jsonData.map((row, index) => {
              // Try to match with an existing student by name or other identifiers
              const matchedStudent = students.find(
                s => s.name === row.Name || s.name === row['Name'] || 
                     s.roll_no === row['Roll Number'] || s.roll_no === row.roll_no
              );
              
              return {
                ...row,
                id: matchedStudent ? matchedStudent.id : `temp-${index}`
              };
            });
            
            setStudents(dataWithIds);
          } else {
            // Just use the Excel data directly
            const dataWithIds = jsonData.map((row, index) => ({
              ...row,
              id: `temp-${index}`
            }));
            
            setStudents(dataWithIds);
          }
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setError('Failed to parse Excel file. Please check the format and try again.');
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    reader.readAsArrayBuffer(file);
  };

  const resetExcelData = () => {
    setExcelFile(null);
    fetchStudents();
    setColumnDefs(defaultColumnDefs);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Students
      </Typography>
      
      <FileUpload onUploadComplete={handleUploadComplete} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <Box>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="excel-file-input"
            type="file"
            onChange={handleExcelFileChange}
            ref={fileInputRef}
          />
          <label htmlFor="excel-file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<FileUploadIcon />}
            >
              Use Excel Structure
            </Button>
          </label>
          {excelFile && (
            <>
              <span style={{ marginLeft: '10px' }}>
                Using: {excelFile.name}
              </span>
              <Button
                variant="outlined" 
                color="error"
                size="small"
                onClick={resetExcelData}
                sx={{ ml: 2 }}
              >
                Reset
              </Button>
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
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
              onClick={handleSaveAll}
              startIcon={<SaveIcon />}
            >
              Save All Changes
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/students/new')}
          >
            Add New Student
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Student List {editMode && <span style={{ color: 'green', fontSize: '0.8em' }}>(Edit Mode Enabled - Click cells to edit)</span>}
          {excelFile && <span style={{ color: 'blue', fontSize: '0.8em', marginLeft: '10px' }}>(Using Excel Structure)</span>}
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
        ) : students.length === 0 ? (
          <Alert severity="info">
            No students found. Upload a CSV file to import students.
          </Alert>
        ) : (
          <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
            <AgGridReact
              rowData={students}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              pagination={true}
              paginationPageSize={10}
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

export default StudentList; 