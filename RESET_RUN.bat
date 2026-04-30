@echo off
setlocal
cd /d %~dp0backend

echo [1/5] Activating venv...
call venv\Scripts\activate.bat

echo [2/5] Deleting old migration files...
if exist users\migrations (
    for %%f in (users\migrations\0*.py) do del /Q "%%f"
)

echo [3/5] Dropping and recreating the database...
set PGPASSWORD=Upload@123
psql -U uploadfiles_user -h localhost -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='uploadfiles_db' AND pid<>pg_backend_pid();"
psql -U uploadfiles_user -h localhost -d postgres -c "DROP DATABASE IF EXISTS uploadfiles_db;"
psql -U uploadfiles_user -h localhost -d postgres -c "CREATE DATABASE uploadfiles_db OWNER uploadfiles_user;"

echo [4/5] Running migrations...
python manage.py makemigrations users
python manage.py migrate

echo [5/5] Starting server...
echo.
echo =====================================================
echo  Open http://localhost:3001 to create Super Admin
echo  Then login at http://localhost:5173
echo =====================================================
python manage.py runserver 8000