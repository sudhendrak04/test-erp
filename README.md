# Result Generation System

A web application for generating and managing results using React frontend and Django backend.

## Project Structure
```
result-system/
├── backend/         # Django backend
└── frontend/        # React frontend
```

## Setup Instructions

### Backend Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   cd backend
   python manage.py migrate
   ```

4. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Features
- Student result management
- Result generation and viewing
- User authentication
- Responsive design
- CSV/Excel file import for bulk data entry

## File Import Feature

### Student Data Import
You can import student data from CSV or Excel files. The file should have the following columns:
- `roll_number`: Student's roll number (unique identifier)
- `name`: Student's full name
- `class_name`: Student's class name

### Result Data Import
You can import result data from CSV or Excel files. The file should have the following columns:
- `student_roll_number`: Roll number of the student (must exist in the database)
- `subject`: Subject name
- `marks_obtained`: Marks obtained by the student
- `total_marks`: Total marks for the subject
- `semester`: Semester name

### Sample Files
Sample CSV files are provided in the `backend` directory:
- `sample_students.csv`: Sample student data
- `sample_results.csv`: Sample result data

### How to Use
1. Navigate to the Students or Results page
2. Click on the "Import Data" section
3. Select the import type (Students or Results)
4. Choose your CSV or Excel file
5. Click "Upload" to import the data 