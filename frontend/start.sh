#!/bin/bash

# ArisuTalk 시작 스크립트
echo "🌟 ArisuTalk을 시작합니다..."

# 포트 확인 및 기존 프로세스 종료
PORT=1277
PID=$(lsof -ti:$PORT)

if [ ! -z "$PID" ]; then
    echo "⚠️  포트 $PORT이 이미 사용 중입니다. 기존 프로세스를 종료합니다..."
    kill -9 $PID
    sleep 1
fi

# Python 확인
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python이 설치되어 있지 않습니다."
    exit 1
fi

echo "🚀 HTTP 서버를 시작합니다..."
echo "📍 주소: http://localhost:$PORT"
echo "⏹️  종료하려면 Ctrl+C를 누르세요"
echo ""

# 서버 시작
$PYTHON_CMD -m http.server $PORT

echo "👋 ArisuTalk이 종료되었습니다."