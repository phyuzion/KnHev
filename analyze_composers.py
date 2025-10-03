#!/usr/bin/env python3
"""
Composer 분석 - 각 composer가 어느 프로젝트 것인지 분석

실행하면 각 composer의:
- 메시지 수
- 파일 경로 샘플
- 마지막 대화 내용
를 보여줌
"""

import sqlite3
import json
from pathlib import Path
from collections import defaultdict

cursor_base = Path.home() / "Library/Application Support/Cursor"
global_db_path = cursor_base / "User/globalStorage/state.vscdb"

print("🔍 모든 Composer 분석 중...\n")

global_conn = sqlite3.connect(str(global_db_path))
global_cursor = global_conn.cursor()

# 1. 모든 composer ID와 메시지 수
global_cursor.execute("""
    SELECT DISTINCT substr(key, 10, 36) as composer_id, COUNT(*) as msg_count 
    FROM cursorDiskKV 
    WHERE key LIKE 'bubbleId:%' 
    GROUP BY composer_id 
    ORDER BY msg_count DESC
""")

composers_info = []

for composer_id, msg_count in global_cursor.fetchall():
    if msg_count < 10:  # 메시지 10개 이하는 스킵
        continue
    
    info = {
        'id': composer_id,
        'msg_count': msg_count,
        'files': set(),
        'last_message': None
    }
    
    # 메타데이터에서 파일 경로 추출
    global_cursor.execute(
        "SELECT value FROM cursorDiskKV WHERE key=?",
        (f"composerData:{composer_id}",)
    )
    result = global_cursor.fetchone()
    
    if result:
        try:
            data = json.loads(result[0])
            context = data.get('context', {})
            
            # 파일 경로들 수집
            for file_sel in context.get('fileSelections', []):
                uri = file_sel.get('uri', {})
                fs_path = uri.get('fsPath', '')
                if fs_path and 'git_source' in fs_path:
                    # 프로젝트명 추출
                    parts = fs_path.split('/')
                    if 'git_source' in parts:
                        idx = parts.index('git_source')
                        if idx + 1 < len(parts):
                            project = parts[idx + 1]
                            info['files'].add(project)
        except:
            pass
    
    # 마지막 메시지 샘플 (최근 3개 중 하나)
    global_cursor.execute(
        f"SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:{composer_id}:%' ORDER BY key DESC LIMIT 3"
    )
    
    for key, value in global_cursor.fetchall():
        try:
            msg_data = json.loads(value)
            if msg_data.get('type') == 1:  # user message
                text = msg_data.get('text', '')
                if text and len(text) > 20:
                    info['last_message'] = text[:200]
                    break
        except:
            pass
    
    composers_info.append(info)

global_conn.close()

# 출력
print(f"📊 총 {len(composers_info)}개의 주요 Composer 발견\n")
print("="*80)

for i, info in enumerate(composers_info, 1):
    print(f"\n#{i} Composer ID: {info['id']}")
    print(f"   💬 메시지 수: {info['msg_count']}개")
    
    if info['files']:
        print(f"   📁 발견된 프로젝트: {', '.join(sorted(info['files']))}")
    else:
        print(f"   📁 프로젝트: (알 수 없음)")
    
    if info['last_message']:
        msg = info['last_message'].replace('\n', ' ')
        print(f"   💭 마지막 대화: {msg}...")
    
    print()

print("="*80)
print("\n💡 이 정보를 보고 각 composer가 어느 프로젝트 것인지 판단할 수 있습니다.")

