#!/usr/bin/env python3
"""
Cursor 대화 내역을 원래 상태로 되돌리기
(무차별 복구로 엉망이 된 걸 정리)

사용법:
1. Cursor 완전 종료
2. python3 restore_original_state.py
3. Cursor 다시 실행
"""

import sqlite3
import json
from pathlib import Path

print("🔄 Cursor 대화 내역 원래 상태로 되돌리기...\n")

cursor_base = Path.home() / "Library/Application Support/Cursor"
workspace_storage_dir = cursor_base / "User/workspaceStorage"

cleaned_count = 0
workspace_dirs = [d for d in workspace_storage_dir.iterdir() if d.is_dir()]

for ws_dir in workspace_dirs:
    workspace_json = ws_dir / "workspace.json"
    state_db = ws_dir / "state.vscdb"
    
    if not workspace_json.exists() or not state_db.exists():
        continue
    
    try:
        with open(workspace_json, 'r') as f:
            ws_info = json.load(f)
        
        folder_path = ws_info.get('folder', '')
        if folder_path.startswith('file://'):
            folder_path = folder_path[7:]
        
        project_name = Path(folder_path).name if folder_path else ws_dir.name
        
        print(f"📁 {project_name}")
        
        # DB 열기
        conn = sqlite3.connect(str(state_db))
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM ItemTable WHERE key='composer.composerData'")
        result = cursor.fetchone()
        
        if not result:
            print(f"   ℹ️  스킵\n")
            conn.close()
            continue
        
        composer_data = json.loads(result[0])
        all_composers = composer_data.get('allComposers', [])
        
        # "복구됨" 또는 "과거 대화"로 시작하는 composer만 제거
        original_composers = [
            c for c in all_composers 
            if not (c.get('name', '').startswith('복구됨') or 
                   c.get('name', '').startswith('과거 대화') or
                   c.get('subtitle', '').startswith('복구된 대화'))
        ]
        
        removed = len(all_composers) - len(original_composers)
        
        if removed > 0:
            composer_data['allComposers'] = original_composers
            
            updated_json = json.dumps(composer_data)
            cursor.execute(
                "UPDATE ItemTable SET value=? WHERE key='composer.composerData'",
                (updated_json,)
            )
            conn.commit()
            print(f"   ✅ {removed}개의 복구된 composer 제거됨")
            cleaned_count += 1
        else:
            print(f"   ℹ️  제거할 composer 없음")
        
        conn.close()
        print()
        
    except Exception as e:
        print(f"   ❌ 오류: {e}\n")
        continue

print("="*60)
print(f"🎉 정리 완료! {cleaned_count}개 워크스페이스 원상복구됨")
print("\n✨ Cursor를 실행하세요!")

