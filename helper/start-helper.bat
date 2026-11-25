@echo off
title Waqar Command Center Helper
cd /d "%~dp0.."
echo Starting Windows System Telemetry Companion on http://127.0.0.1:4789 ...
node helper\server.mjs
pause
