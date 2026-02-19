@echo off
cd /d "C:\Users\onite\.vscode\projects\HIIT Gym"
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "auto-save: %date% %time%"
"C:\Program Files\Git\bin\git.exe" push origin autosave