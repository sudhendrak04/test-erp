import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import ResultList from './components/ResultList';
import ResultForm from './components/ResultForm';
import CsvViewer from './components/CsvViewer';
import './styles/ag-grid-theme.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<StudentList />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/new" element={<StudentForm />} />
          <Route path="/students/:id/edit" element={<StudentForm />} />
          <Route path="/results" element={<ResultList />} />
          <Route path="/results/new" element={<ResultForm />} />
          <Route path="/results/:id/edit" element={<ResultForm />} />
          <Route path="/csv-viewer" element={<CsvViewer />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
