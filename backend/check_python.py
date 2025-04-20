import sys
import os

print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"Python path: {sys.path}")

try:
    import rest_framework
    print(f"Rest framework version: {rest_framework.__version__}")
    print("Rest framework is installed")
except ImportError:
    print("Rest framework is NOT installed") 