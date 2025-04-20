from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
# from rest_framework import viewsets, status
# from rest_framework.permissions import AllowAny
# from rest_framework.decorators import action
# from rest_framework.response import Response
from .models import Student, Result
# from .serializers import StudentSerializer, ResultSerializer
from .utils import import_students_from_file, import_results_from_file
import json

# Create your views here.

@csrf_exempt
def student_list(request):
    if request.method == 'GET':
        students = list(Student.objects.all().values())
        return JsonResponse(students, safe=False)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            student = Student.objects.create(
                roll_number=data.get('roll_number'),
                name=data.get('name'),
                class_name=data.get('class_name')
            )
            return JsonResponse({
                'id': student.id,
                'roll_number': student.roll_number,
                'name': student.name,
                'class_name': student.class_name
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({"message": "Method not allowed"}, status=405)

@csrf_exempt
def student_import(request):
    if request.method == 'POST' and 'file' in request.FILES:
        file = request.FILES['file']
        success, message = import_students_from_file(file)
        if success:
            return JsonResponse({'message': message}, status=200)
        else:
            return JsonResponse({'message': message}, status=400)
    return JsonResponse({'message': 'No file uploaded'}, status=400)

@csrf_exempt
def result_list(request):
    if request.method == 'GET':
        results = list(Result.objects.all().values())
        return JsonResponse(results, safe=False)
    return JsonResponse({"message": "Method not allowed"}, status=405)

@csrf_exempt
def result_import(request):
    if request.method == 'POST' and 'file' in request.FILES:
        file = request.FILES['file']
        success, message = import_results_from_file(file)
        if success:
            return JsonResponse({'message': message}, status=200)
        else:
            return JsonResponse({'message': message}, status=400)
    return JsonResponse({'message': 'No file uploaded'}, status=400)
    
# class StudentViewSet(viewsets.ModelViewSet):
#     queryset = Student.objects.all()
#     serializer_class = StudentSerializer
#     permission_classes = [AllowAny]
    
#     @action(detail=False, methods=['post'])
#     def import_file(self, request):
#         if 'file' not in request.FILES:
#             return Response(
#                 {'message': 'No file uploaded'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         file = request.FILES['file']
#         success, message = import_students_from_file(file)
        
#         if success:
#             return Response({'message': message}, status=status.HTTP_200_OK)
#         else:
#             return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)

# class ResultViewSet(viewsets.ModelViewSet):
#     queryset = Result.objects.all()
#     serializer_class = ResultSerializer
#     permission_classes = [AllowAny]
    
#     @action(detail=False, methods=['post'])
#     def import_file(self, request):
#         if 'file' not in request.FILES:
#             return Response(
#                 {'message': 'No file uploaded'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         file = request.FILES['file']
#         success, message = import_results_from_file(file)
        
#         if success:
#             return Response({'message': message}, status=status.HTTP_200_OK)
#         else:
#             return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)
