@echo off
chcp 65001 > nul
type "%~dp0Code.gs" | clip
echo.
echo  ✅ Code.gs 복사 완료!
echo  GAS 에디터에서 Ctrl+A 후 Ctrl+V 로 붙여넣기 하세요.
echo.
pause
