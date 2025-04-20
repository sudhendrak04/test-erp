from django.urls import path, include
# from rest_framework.routers import DefaultRouter
from .views import student_list, result_list, student_import, result_import

# router = DefaultRouter()
# router.register(r'students', StudentViewSet)
# router.register(r'results', ResultViewSet)

urlpatterns = [
    # path('', include(router.urls)),
    path('students/', student_list, name='student-list'),
    path('results/', result_list, name='result-list'),
    path('students/import/', student_import, name='student-import'),
    path('results/import/', result_import, name='result-import'),
] 