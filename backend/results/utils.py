import pandas as pd
from .models import Student, Result

def import_students_from_file(file):
    """
    Import students from a CSV or Excel file.
    Expected columns: roll_number, name, class_name
    """
    try:
        # Determine file type and read accordingly
        file_extension = file.name.split('.')[-1].lower()
        
        if file_extension == 'csv':
            df = pd.read_csv(file)
        elif file_extension in ['xlsx', 'xls']:
            df = pd.read_excel(file)
        else:
            return False, "Unsupported file format. Please upload a CSV or Excel file."
        
        # Check if required columns exist
        required_columns = ['roll_number', 'name', 'class_name']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return False, f"Missing required columns: {', '.join(missing_columns)}"
        
        # Process each row
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Check if student already exists
                student, created = Student.objects.get_or_create(
                    roll_number=row['roll_number'],
                    defaults={
                        'name': row['name'],
                        'class_name': row['class_name']
                    }
                )
                
                if not created:
                    # Update existing student
                    student.name = row['name']
                    student.class_name = row['class_name']
                    student.save()
                
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append(f"Row {index + 2}: {str(e)}")
        
        message = f"Successfully imported {success_count} students."
        if error_count > 0:
            message += f" Failed to import {error_count} students."
        
        return True, message
    except Exception as e:
        return False, f"Error processing file: {str(e)}"

def import_results_from_file(file):
    """
    Import results from a CSV or Excel file.
    Expected columns: student_roll_number, subject, marks_obtained, total_marks, semester
    """
    try:
        # Determine file type and read accordingly
        file_extension = file.name.split('.')[-1].lower()
        
        if file_extension == 'csv':
            df = pd.read_csv(file)
        elif file_extension in ['xlsx', 'xls']:
            df = pd.read_excel(file)
        else:
            return False, "Unsupported file format. Please upload a CSV or Excel file."
        
        # Check if required columns exist
        required_columns = ['student_roll_number', 'subject', 'marks_obtained', 'total_marks', 'semester']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return False, f"Missing required columns: {', '.join(missing_columns)}"
        
        # Process each row
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Find student by roll number
                try:
                    student = Student.objects.get(roll_number=row['student_roll_number'])
                except Student.DoesNotExist:
                    errors.append(f"Row {index + 2}: Student with roll number {row['student_roll_number']} not found")
                    error_count += 1
                    continue
                
                # Create or update result
                result, created = Result.objects.get_or_create(
                    student=student,
                    subject=row['subject'],
                    semester=row['semester'],
                    defaults={
                        'marks_obtained': row['marks_obtained'],
                        'total_marks': row['total_marks']
                    }
                )
                
                if not created:
                    # Update existing result
                    result.marks_obtained = row['marks_obtained']
                    result.total_marks = row['total_marks']
                    result.save()
                
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append(f"Row {index + 2}: {str(e)}")
        
        message = f"Successfully imported {success_count} results."
        if error_count > 0:
            message += f" Failed to import {error_count} results."
        
        return True, message
    except Exception as e:
        return False, f"Error processing file: {str(e)}" 