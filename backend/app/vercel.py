# backend/app/vercel.py
from app.main import app

# ⚠️ НЕ нужно создавать handler = app
# Vercel сам подхватит переменную app
# просто убедись, что это объект FastAPI, не функция

# пример проверки:
# print(type(app))  # <class 'fastapi.applications.FastAPI'>
