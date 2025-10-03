#!/usr/bin/env python3
"""
모든 프로젝트의 Cursor 대화 내역 자동 복구 스크립트
사용법:
1. Cursor 완전 종료
2. python3 restore_all_cursor_history.py
3. Cursor 다시 실행
"""

import sqlite3
import json
import os
from pathlib import Path
from collections import defaultdict

print("🚀 전체 Cursor 대화 내역 복구 시작...\n")

# 경로 설정
cursor_base = Path.home() / "Library/Application Support/Cursor"
workspace_storage_dir = cursor_base / "User/workspaceStorage"
global_db_path = cursor_base / "User/globalStorage/state.vscdb"

# 1. 글로벌 DB에서 모든 composer ID와 메시지 수 가져오기
print("📊 글로벌 DB에서 모든 composer 정보 수집 중...")
global_conn = sqlite3.connect(str(global_db_path))
global_cursor = global_conn.cursor()

# composer ID별 메시지 수
global_cursor.execute("""
    SELECT DISTINCT substr(key, 10, 36) as composer_id, COUNT(*) as msg_count 
    FROM cursorDiskKV 
    WHERE key LIKE 'bubbleId:%' 
    GROUP BY composer_id 
    ORDER BY msg_count DESC
""")

all_composers = {}
for row in global_cursor.fetchall():
    composer_id, msg_count = row
    all_composers[composer_id] = msg_count

print(f"✅ 총 {len(all_composers)}개의 composer 발견")
print(f"📝 총 메시지: {sum(all_composers.values())}개\n")

# 2. 각 composer의 메타데이터 가져오기
composer_metadata = {}
for composer_id in all_composers.keys():
    key = f"composerData:{composer_id}"
    global_cursor.execute(
        "SELECT value FROM cursorDiskKV WHERE key=?",
        (key,)
    )
    result = global_cursor.fetchone()
    if result:
        try:
            data = json.loads(result[0])
            composer_metadata[composer_id] = data
        except:
            pass

global_conn.close()

# 3. 모든 워크스페이스 순회
print("🔍 워크스페이스 스캔 중...\n")

workspace_dirs = [d for d in workspace_storage_dir.iterdir() if d.is_dir()]
print(f"📂 총 {len(workspace_dirs)}개의 워크스페이스 발견\n")

restored_count = 0
skipped_count = 0

for ws_dir in workspace_dirs:
    workspace_json = ws_dir / "workspace.json"
    state_db = ws_dir / "state.vscdb"
    
    if not workspace_json.exists() or not state_db.exists():
        continue
    
    # 워크스페이스 정보 읽기
    try:
        with open(workspace_json, 'r') as f:
            ws_info = json.load(f)
        
        folder_path = ws_info.get('folder', 'Unknown')
        if folder_path.startswith('file://'):
            folder_path = folder_path[7:]
        
        project_name = Path(folder_path).name if folder_path != 'Unknown' else ws_dir.name
        
        print(f"📁 {project_name}")
        print(f"   경로: {folder_path}")
        
    except Exception as e:
        print(f"⚠️  {ws_dir.name}: workspace.json 읽기 실패")
        continue
    
    # 워크스페이스 DB 열기
    try:
        conn = sqlite3.connect(str(state_db))
        cursor = conn.cursor()
        
        # 현재 등록된 composer 확인
        cursor.execute("SELECT value FROM ItemTable WHERE key='composer.composerData'")
        result = cursor.fetchone()
        
        if not result:
            print(f"   ⚠️  composer.composerData 없음 (신규 워크스페이스?)")
            conn.close()
            skipped_count += 1
            continue
        
        composer_data = json.loads(result[0])
        current_composers = composer_data.get('allComposers', [])
        current_composer_ids = {c.get('composerId') for c in current_composers}
        
        print(f"   현재 등록된 composer: {len(current_composers)}개")
        
        # 이 워크스페이스에 속할 수 있는 composer ID 찾기
        # (완벽한 매칭은 어려우므로, 일단 모든 composer를 추가)
        
        added_count = 0
        for composer_id, msg_count in all_composers.items():
            if composer_id not in current_composer_ids and msg_count > 0:
                # composer 추가
                metadata = composer_metadata.get(composer_id, {})
                
                old_composer = {
                    "type": "head",
                    "composerId": composer_id,
                    "createdAt": 0,
                    "unifiedMode": "agent",
                    "hasUnreadMessages": False,
                    "totalLinesAdded": 0,
                    "totalLinesRemoved": 0,
                    "hasBlockingPendingActions": False,
                    "isArchived": False,
                    "isWorktree": False,
                    "isSpec": False,
                    "lastUpdatedAt": 0,
                    "subtitle": f"복구된 대화 ({msg_count}개 메시지)",
                    "contextUsagePercent": 0,
                    "name": f"복구됨 - {composer_id[:8]}"
                }
                
                composer_data['allComposers'].append(old_composer)
                added_count += 1
        
        if added_count > 0:
            # DB 업데이트
            updated_json = json.dumps(composer_data)
            cursor.execute(
                "UPDATE ItemTable SET value=? WHERE key='composer.composerData'",
                (updated_json,)
            )
            conn.commit()
            print(f"   ✅ {added_count}개의 과거 composer 추가됨")
            restored_count += 1
        else:
            print(f"   ℹ️  추가할 composer 없음")
            skipped_count += 1
        
        conn.close()
        print()
        
    except Exception as e:
        print(f"   ❌ 오류: {e}\n")
        continue

# 요약
print("="*60)
print("🎉 복구 완료!\n")
print(f"✅ 복구된 워크스페이스: {restored_count}개")
print(f"⏭️  스킵된 워크스페이스: {skipped_count}개")
print(f"📊 총 composer: {len(all_composers)}개")
print(f"💬 총 메시지: {sum(all_composers.values())}개")
print("\n✨ 이제 Cursor를 실행하세요!")

