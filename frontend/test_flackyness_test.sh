#!/bin/bash

# 환경에 맞춰 수정하세요
ITERATIONS=30
COMMANDS=(
  "pnpm run -F frontend test:coverage"
  "pnpm run -F frontend test"
  "pnpm run -F frontend test:browser"
)

echo "��� Flaky 테스트 체크 시작 ($ITERATIONS 회 반복)..."
echo "✅ 성공 시 아무것도 출력되지 않습니다."

for i in $(seq 1 $ITERATIONS); do
  for cmd in "${COMMANDS[@]}"; do
    # 표준 출력(stdout)과 에러 출력(stderr)을 임시 파일에 기록
    # &> 는 bash에서 출력과 에러를 모두 리다이렉션합니다.
    if ! tmp_log=$( $cmd 2>&1 ); then
      echo -e "\n❌ [실패 발생] 반복 회차: $i"
      echo "❌ 실패한 명령어: $cmd"
      echo "------------------------------------------"
      echo "$tmp_log" # 실패했을 때만 수집된 로그 출력
      echo "------------------------------------------"
      exit 1
    else
      echo -n "."
    fi
  done
  echo -n "/"
done

echo -e "\n✨ 모든 테스트가 $ITERATIONS 회 동안 성공했습니다!"
