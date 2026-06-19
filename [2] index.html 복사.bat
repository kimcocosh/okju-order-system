@echo off
chcp 65001 > nul
type "%~dp0index.html" | clip
echo.
echo  ✅ index.html 복사 완료!
echo  GAS 에디터에서 index 파일 열고 Ctrl+A 후 Ctrl+V 로 붙여넣기 하세요.
echo.
pause
