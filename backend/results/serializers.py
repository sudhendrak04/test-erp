from rest_framework import serializers
from .models import Student, Result

class ResultSerializer(serializers.ModelSerializer):
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Result
        fields = ['id', 'student', 'subject', 'marks_obtained', 'total_marks', 'semester', 'percentage', 'created_at', 'updated_at']

class StudentSerializer(serializers.ModelSerializer):
    results = ResultSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'roll_number', 'name', 'class_name', 'results', 'created_at', 'updated_at'] 