@echo off
"C:\Users\alexb\AppData\Local\Programs\Python\Python312\python.exe" -u "G:\My Drive\Personal\Cursor Projects\SecondYear_SecondSem_Website\public\auto_email.py" > "G:\My Drive\Personal\Cursor Projects\SecondYear_SecondSem_Website\public\wrapper_debug.log" 2>&1
echo Exit Code: %ERRORLEVEL% >> "G:\My Drive\Personal\Cursor Projects\SecondYear_SecondSem_Website\public\wrapper_debug.log"
exit
