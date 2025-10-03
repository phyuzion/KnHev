#!/usr/bin/env python3
"""
스마트 Cursor 대화 내역 복구 - 프로젝트별 자동 매칭
사용법:
1. Cursor 완전 종료
2. python3 restore_smart_cursor_history.py
3. Cursor 다시 실행
"""

import sqlite3
import json
import os
from pathlib import Path

print("🧠 스마트 Cursor 대화 내역 복구 시작...\n")

# 경로 설정
cursor_base = Path.home() / "Library/Application Support/Cursor"
workspace_storage_dir = cursor_base / "User/workspaceStorage"
global_db_path = cursor_base / "User/globalStorage/state.vscdb"

# 1. 글로벌 DB에서 모든 composer 정보 가져오기
print("📊 글로벌 DB 분석 중...")
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
print(f"💬 총 메시지: {sum(all_composers.values())}개\n")

# 2. 각 composer의 메타데이터와 프로젝트 경로 추출
print("🔍 각 composer의 프로젝트 경로 분석 중...\n")

composer_to_project = {}  # composer_id -> project_path

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
            context = data.get('context', {})
            
            # 파일 선택에서 프로젝트 경로 추출
            file_selections = context.get('fileSelections', [])
            if file_selections and len(file_selections) > 0:
                first_file = file_selections[0].get('uri', {})
                fs_path = first_file.get('fsPath', '')
                
                if fs_path:
                    # 프로젝트 루트 추정 (git_source까지 또는 적절한 상위 디렉토리)
                    path_parts = Path(fs_path).parts
                    
                    # git_source/프로젝트명 패턴 찾기
                    if 'git_source' in path_parts:
                        idx = path_parts.index('git_source')
                        if idx + 1 < len(path_parts):
                            project_path = str(Path(*path_parts[:idx+2]))
                            composer_to_project[composer_id] = project_path
                            continue
                    
                    # 또는 상위 3-4 레벨까지만
                    if len(path_parts) >= 4:
                        project_path = str(Path(*path_parts[:4]))
                        composer_to_project[composer_id] = project_path
                        
        except Exception as e:
            pass

print(f"✅ {len(composer_to_project)}개의 composer에서 프로젝트 경로 발견\n")

global_conn.close()

# 3. 워크스페이스별로 매칭하여 복구
print("🔧 워크스페이스별 복구 시작...\n")

workspace_dirs = [d for d in workspace_storage_dir.iterdir() if d.is_dir()]
restored_count = 0
total_added = 0

for ws_dir in workspace_dirs:
    workspace_json = ws_dir / "workspace.json"
    state_db = ws_dir / "state.vscdb"
    
    if not workspace_json.exists() or not state_db.exists():
        continue
    
    try:
        # 워크스페이스 정보
        with open(workspace_json, 'r') as f:
            ws_info = json.load(f)
        
        folder_path = ws_info.get('folder', '')
        if folder_path.startswith('file://'):
            folder_path = folder_path[7:]
        
        if not folder_path:
            continue
        
        project_name = Path(folder_path).name
        print(f"📁 {project_name}")
        print(f"   {folder_path}")
        
        # 이 워크스페이스에 해당하는 composer 찾기
        matching_composers = []
        for composer_id, project_path in composer_to_project.items():
            if folder_path in project_path or project_path in folder_path:
                matching_composers.append(composer_id)
        
        if not matching_composers:
            print(f"   ℹ️  매칭되는 composer 없음\n")
            continue
        
        print(f"   🎯 매칭된 composer: {len(matching_composers)}개")
        
        # DB 업데이트
        conn = sqlite3.connect(str(state_db))
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM ItemTable WHERE key='composer.composerData'")
        result = cursor.fetchone()
        
        if not result:
            print(f"   ⚠️  composer.composerData 없음\n")
            conn.close()
            continue
        
        composer_data = json.loads(result[0])
        current_composers = composer_data.get('allComposers', [])
        current_composer_ids = {c.get('composerId') for c in current_composers}
        
        added = 0
        for composer_id in matching_composers:
            if composer_id not in current_composer_ids:
                msg_count = all_composers[composer_id]
                
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
                    "name": f"과거 대화 - {composer_id[:8]}"
                }
                
                composer_data['allComposers'].insert(0, old_composer)
                added += 1
        
        if added > 0:
            updated_json = json.dumps(composer_data)
            cursor.execute(
                "UPDATE ItemTable SET value=? WHERE key='composer.composerData'",
                (updated_json,)
            )
            conn.commit()
            print(f"   ✅ {added}개의 과거 composer 추가됨")
            restored_count += 1
            total_added += added
        else:
            print(f"   ℹ️  이미 모두 등록됨")
        
        conn.close()
        print()
        
    except Exception as e:
        print(f"   ❌ 오류: {e}\n")
        continue

# 요약
print("="*60)
print("🎉 스마트 복구 완료!\n")
print(f"✅ 복구된 워크스페이스: {restored_count}개")
print(f"📝 추가된 composer: {total_added}개")
print(f"📊 인식된 composer: {len(composer_to_project)}/{len(all_composers)}개")
print("\n✨ Cursor를 실행하세요!")

