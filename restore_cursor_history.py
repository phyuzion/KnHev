#!/usr/bin/env python3
"""
Cursor 과거 대화 내역 복구 스크립트
사용법:
1. Cursor 완전 종료
2. python3 restore_cursor_history.py
3. Cursor 다시 실행
"""

import sqlite3
import json
import os
from pathlib import Path

# 경로 설정
workspace_db_path = Path.home() / "Library/Application Support/Cursor/User/workspaceStorage/9d663d653e109d2b7910ce6f3460dd43/state.vscdb"
global_db_path = Path.home() / "Library/Application Support/Cursor/User/globalStorage/state.vscdb"

# 과거 composer ID
old_composer_id = "0182798f-cd0c-47a8-946f-70107f1e6f2b"

print("🔍 Cursor 대화 내역 복구 시작...")

# 1. 워크스페이스 DB 연결
print(f"📂 워크스페이스 DB 열기: {workspace_db_path}")
conn = sqlite3.connect(str(workspace_db_path))
cursor = conn.cursor()

# 2. 현재 composer.composerData 가져오기
cursor.execute("SELECT value FROM ItemTable WHERE key='composer.composerData'")
result = cursor.fetchone()

if not result:
    print("❌ composer.composerData를 찾을 수 없습니다.")
    conn.close()
    exit(1)

composer_data = json.loads(result[0])
print(f"✅ 현재 composer 개수: {len(composer_data.get('allComposers', []))}")

# 3. 과거 composer 추가
old_composer_exists = any(c.get('composerId') == old_composer_id for c in composer_data.get('allComposers', []))

if old_composer_exists:
    print(f"✅ 과거 composer가 이미 등록되어 있습니다: {old_composer_id}")
else:
    print(f"📝 과거 composer 추가 중: {old_composer_id}")
    
    # 과거 composer 객체 생성
    old_composer = {
        "type": "head",
        "composerId": old_composer_id,
        "createdAt": 0,  # 타임스탬프는 적절히 설정
        "unifiedMode": "agent",
        "hasUnreadMessages": False,
        "totalLinesAdded": 0,
        "totalLinesRemoved": 0,
        "hasBlockingPendingActions": False,
        "isArchived": False,
        "isWorktree": False,
        "isSpec": False,
        "lastUpdatedAt": 0,
        "subtitle": "과거 대화 내역 (989개 세션, 2,059개 메시지)",
        "contextUsagePercent": 0,
        "name": "과거 대화 내역 - 복구됨"
    }
    
    # allComposers 배열에 추가 (맨 앞에)
    if 'allComposers' not in composer_data:
        composer_data['allComposers'] = []
    
    composer_data['allComposers'].insert(0, old_composer)
    
    # 4. DB 업데이트
    updated_json = json.dumps(composer_data)
    cursor.execute(
        "UPDATE ItemTable SET value=? WHERE key='composer.composerData'",
        (updated_json,)
    )
    conn.commit()
    print("✅ 워크스페이스 DB 업데이트 완료")

conn.close()

# 5. 글로벌 DB에서 메시지 수 확인
print(f"\n📊 글로벌 DB 확인: {global_db_path}")
global_conn = sqlite3.connect(str(global_db_path))
global_cursor = global_conn.cursor()

global_cursor.execute(
    f"SELECT COUNT(*) FROM cursorDiskKV WHERE key LIKE 'bubbleId:{old_composer_id}:%'"
)
message_count = global_cursor.fetchone()[0]
print(f"✅ 과거 메시지 수: {message_count}개")

global_conn.close()

print("\n🎉 복구 완료!")
print("✨ 이제 Cursor를 실행하면 과거 대화 내역이 보일 것입니다.")
print(f"📝 Composer ID: {old_composer_id}")
print(f"💬 총 메시지: {message_count}개")


