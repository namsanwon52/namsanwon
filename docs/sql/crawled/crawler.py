#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
namsanwon.or.kr 전체 게시판 크롤러
- 모든 게시판 게시물 수집
- 이미지/첨부파일 다운로드
- INSERT SQL 생성
"""

import urllib.request
import urllib.parse
import urllib.error
import re
import os
import time
import json
import sys
import io
import threading
from html.parser import HTMLParser
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = 'http://namsanwon.or.kr'
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)))
_script_dir = os.path.dirname(os.path.abspath(__file__))          # .../docs/sql/crawled
_project_root = os.path.normpath(os.path.join(_script_dir, '..', '..', '..'))  # D:\Project\namsanwon
IMAGE_DIR = os.path.join(_project_root, 'public', 'crawled')
STATE_FILE = os.path.join(OUTPUT_DIR, 'crawl_state.json')

BOARDS = [
    {'name': '공지사항',    'php': '/05/commu01.php', 'code': 'nt1',  'pages': 78},
    {'name': '자유게시판',  'php': '/05/commu02.php', 'code': 'com1', 'pages': 11},
    {'name': '예산',        'php': '/05/commu06.php', 'code': 'nt2',  'pages': 3},
    {'name': '결산',        'php': '/05/commu07.php', 'code': 'nt3',  'pages': 3},
    {'name': '법인',        'php': '/05/commu08.php', 'code': 'nt4',  'pages': 3},
    {'name': '갤러리',      'php': '/05/commu09.php', 'code': 'com3', 'pages': 117},
    {'name': '영아방',      'php': '/04/baby01.php',  'code': 'liv2', 'pages': 252},
    {'name': '아동생활',    'php': '/04/baby02.php',  'code': 'liv1', 'pages': 477},
    {'name': '학교생활',    'php': '/04/baby03.php',  'code': 'dus3', 'pages': 107},
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'ko-KR,ko;q=0.9',
}

lock = threading.Lock()


def fetch(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read()
            return raw.decode('utf-8', errors='replace')
        except Exception as e:
            if i == retries - 1:
                print(f'  [ERROR] fetch failed: {url} -> {e}')
                return None
            time.sleep(1 + i)
    return None


def fetch_binary(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except Exception as e:
            if i == retries - 1:
                print(f'  [ERROR] binary fetch failed: {url} -> {e}')
                return None
            time.sleep(1 + i)
    return None


def escape_sql(s):
    if s is None:
        return 'NULL'
    s = str(s)
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    s = s.replace('\x00', '')
    return "'" + s + "'"


def get_post_ids_from_page(board, page):
    """게시판 목록 페이지에서 게시물 idx 수집"""
    url = f"{BASE_URL}{board['php']}?page={page}&code={board['code']}"
    content = fetch(url)
    if not content:
        return []

    # Extract idx values from href links
    pattern = rf"ptype=view&idx=(\d+)&[^'\"]*code={board['code']}"
    ids = re.findall(pattern, content)
    # Also try without code in URL
    if not ids:
        ids = re.findall(r'ptype=view&idx=(\d+)', content)
    return list(dict.fromkeys(ids))  # deduplicate preserving order


def parse_post_detail(content, board, idx):
    """게시물 상세 페이지 파싱"""
    post = {
        'idx': idx,
        'code': board['code'],
        'board_name': board['name'],
        'name': '',
        'email': '',
        'subject': '',
        'content': '',
        'wdate': '',
        'count': 0,
        'files': [],      # [(stored_name, original_name), ...]
        'images': [],     # image URLs found in content
    }

    # 이름 (author)
    m = re.search(r'<strong>이름</strong>.*?<td[^>]*>(.*?)</td>', content, re.DOTALL)
    if m:
        post['name'] = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    # 이메일
    m = re.search(r'<strong>이메일</strong>.*?<td[^>]*>(.*?)</td>', content, re.DOTALL)
    if m:
        post['email'] = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    # 작성일
    m = re.search(r'<strong>작성일</strong>.*?<td[^>]*>(.*?)</td>', content, re.DOTALL)
    if m:
        post['wdate'] = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    # 조회수
    m = re.search(r'<strong>조회수</strong>.*?<td[^>]*>(.*?)</td>', content, re.DOTALL)
    if m:
        count_str = re.sub(r'<[^>]+>', '', m.group(1)).strip().replace(',', '')
        try:
            post['count'] = int(count_str)
        except:
            post['count'] = 0

    # 제목
    m = re.search(r'<strong>제목</strong>.*?<td[^>]*>(.*?)</td\s*>', content, re.DOTALL)
    if m:
        subject_html = m.group(1)
        # Remove inner table if present - get text
        m2 = re.search(r"width=['\"]80%['\"][^>]*>(.*?)</td", subject_html, re.DOTALL)
        if m2:
            post['subject'] = re.sub(r'<[^>]+>', '', m2.group(1)).strip()
        else:
            post['subject'] = re.sub(r'<[^>]+>', '', subject_html).strip()

    # 파일첨부
    m = re.search(r'<strong>파일첨부</strong>.*?<td[^>]*>(.*?)</td\s*>', content, re.DOTALL)
    if m:
        attach_html = m.group(1)
        file_links = re.findall(r"href='(/admin/bbs/down\.php\?[^']+)'[^>]*>([^<]+)<", attach_html)
        for link, fname in file_links:
            params = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(link).query))
            stored_no = params.get('no', '1')
            post['files'].append({
                'url': BASE_URL + link,
                'original_name': fname.strip(),
                'no': stored_no,
            })

    # 본문 내용 추출
    content_start = content.find('<strong>제목</strong>')
    if content_start > 0:
        # Find the content block after the title row
        body_start = content.find('padding-top:5px', content_start)
        if body_start > 0:
            td_start = content.rfind('<td', 0, body_start)
            body_start = content.find('>', td_start) + 1
            # Find end of content
            body_end = content.find('<!-- 다음글', body_start)
            if body_end < 0:
                body_end = content.find('</table>', body_start + 100)
            if body_end < 0:
                body_end = body_start + 5000
            post['content'] = content[body_start:body_end].strip()

    # 본문 내 이미지 URL 추출
    img_urls = re.findall(r"<img[^>]+src=['\"]?(/admin/data/bbs/[^'\">\s]+)['\"]?", post['content'])
    post['images'] = list(dict.fromkeys(img_urls))

    # viewImg() 호출에서 이미지 파일명 추출
    view_imgs = re.findall(r"viewImg\('([^']+)'\)", post['content'])
    for img_name in view_imgs:
        img_url = f"/admin/data/bbs/{board['code']}/{img_name}"
        if img_url not in post['images']:
            post['images'].append(img_url)

    return post


def download_file(url, save_path):
    """파일 다운로드"""
    if os.path.exists(save_path):
        return True
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    data = fetch_binary(url)
    if data:
        with open(save_path, 'wb') as f:
            f.write(data)
        return True
    return False


def download_post_files(post, board_img_dir):
    """게시물의 첨부파일 및 이미지 다운로드"""
    downloaded = []

    # 첨부파일
    for f in post['files']:
        fname = f['original_name']
        # Sanitize filename
        fname_safe = re.sub(r'[\\/:*?"<>|]', '_', fname)
        save_path = os.path.join(board_img_dir, fname_safe)
        if download_file(f['url'], save_path):
            downloaded.append({'type': 'file', 'url': f['url'], 'local': fname_safe})

    # 본문 이미지
    for img_url in post['images']:
        fname = os.path.basename(img_url)
        fname_safe = re.sub(r'[\\/:*?"<>|]', '_', fname)
        # Skip thumbnails (M prefix) - download full size instead
        if fname.startswith('M') and len(fname) > 1:
            full_img_url = img_url.replace('/M', '/')
            fname_safe = fname[1:]  # Remove M prefix for full image
            full_save_path = os.path.join(board_img_dir, fname_safe)
            if download_file(BASE_URL + full_img_url, full_save_path):
                downloaded.append({'type': 'image', 'url': full_img_url, 'local': fname_safe})
        else:
            save_path = os.path.join(board_img_dir, fname_safe)
            if download_file(BASE_URL + img_url, save_path):
                downloaded.append({'type': 'image', 'url': img_url, 'local': fname_safe})

    return downloaded


def post_to_sql(post, downloaded_files):
    """게시물 데이터를 INSERT SQL로 변환"""
    # Convert date string like "26.06.22" -> timestamp
    wdate_ts = 0
    try:
        date_str = post['wdate']
        if re.match(r'\d{2}\.\d{2}\.\d{2}', date_str):
            parts = date_str.split('.')
            year = 2000 + int(parts[0])
            month = int(parts[1])
            day = int(parts[2])
            dt = datetime(year, month, day)
            wdate_ts = int(dt.timestamp())
        elif re.match(r'\d{4}-\d{2}-\d{2}', date_str):
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            wdate_ts = int(dt.timestamp())
    except:
        pass

    # Build upfile fields from downloaded_files
    upfiles = [f for f in downloaded_files if f['type'] == 'file']
    upfile_fields = []
    for i in range(1, 13):
        if i <= len(upfiles):
            upfile_fields.append(escape_sql(upfiles[i-1]['local']))
        else:
            upfile_fields.append("''")

    upfile_names = []
    for i in range(1, 13):
        if i <= len(post['files']):
            upfile_names.append(escape_sql(post['files'][i-1]['original_name']))
        else:
            upfile_names.append("''")

    uf0 = upfile_fields[0] if upfile_fields else "''"
    uf1 = upfile_fields[1] if len(upfile_fields) > 1 else "''"
    uf2 = upfile_fields[2] if len(upfile_fields) > 2 else "''"
    un0 = upfile_names[0] if upfile_names else "''"
    un1 = upfile_names[1] if len(upfile_names) > 1 else "''"
    un2 = upfile_names[2] if len(upfile_names) > 2 else "''"

    sql = (
        f"INSERT INTO `wiz_bbs` "
        f"(`idx`,`code`,`name`,`email`,`subject`,`content`,`count`,`wdate`,"
        f"`upfile1`,`upfile2`,`upfile3`,`upfile1_name`,`upfile2_name`,`upfile3_name`) VALUES ("
        f"{post['idx']},"
        f"{escape_sql(post['code'])},"
        f"{escape_sql(post['name'])},"
        f"{escape_sql(post['email'])},"
        f"{escape_sql(post['subject'])},"
        f"{escape_sql(post['content'])},"
        f"{post['count']},"
        f"{wdate_ts},"
        f"{uf0}, {uf1}, {uf2}, "
        f"{un0}, {un1}, {un2}"
        f");"
    )
    return sql


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_state(state):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def crawl_board(board, state):
    board_code = board['code']
    board_name = board['name']
    print(f'\n{"="*60}')
    print(f'크롤링 시작: {board_name} (코드: {board_code})')
    print(f'{"="*60}')

    if board_code not in state:
        state[board_code] = {'done_ids': [], 'done_pages': []}

    board_state = state[board_code]
    done_ids = set(board_state.get('done_ids', []))
    done_pages = set(board_state.get('done_pages', []))

    # Output files
    sql_file = os.path.join(OUTPUT_DIR, f'{board_code}_{board_name}.sql')
    # Prefix with 'bbs_' to avoid Windows reserved device names (COM1, COM3, LPT1 etc.)
    board_img_dir = os.path.join(IMAGE_DIR, f'bbs_{board_code}')
    os.makedirs(board_img_dir, exist_ok=True)

    # Write SQL header
    if not os.path.exists(sql_file):
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write(f'-- 게시판: {board_name} (code: {board_code})\n')
            f.write(f'-- 크롤링 일시: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
            f.write(f'-- Base URL: {BASE_URL}{board["php"]}\n\n')
            f.write('SET NAMES utf8mb4;\n\n')

    all_ids = []

    # Step 1: Collect all post IDs from all pages
    print(f'  [1/2] 목록 수집 중 (총 {board["pages"]}페이지)...')
    for page in range(1, board['pages'] + 1):
        if str(page) in done_pages:
            continue

        ids = get_post_ids_from_page(board, page)
        new_ids = [i for i in ids if i not in done_ids]
        all_ids.extend(new_ids)

        board_state['done_pages'].append(str(page))

        if page % 10 == 0:
            print(f'    페이지 {page}/{board["pages"]} 완료, 수집된 ID: {len(all_ids)}')
            save_state(state)

        time.sleep(0.05)  # Be polite

    # Deduplicate all_ids preserving order
    all_ids = list(dict.fromkeys(all_ids))
    print(f'  총 {len(all_ids)}개 새 게시물 발견')

    # Step 2: Crawl each post (parallel, max 3 workers)
    print(f'  [2/2] 게시물 상세 수집 중...')

    def crawl_single_post(idx):
        url = f"{BASE_URL}{board['php']}?ptype=view&idx={idx}&page=1&code={board_code}"
        content = fetch(url)
        if not content:
            return None

        post = parse_post_detail(content, board, idx)
        downloaded = download_post_files(post, board_img_dir)
        sql = post_to_sql(post, downloaded)
        return (idx, sql, post['subject'])

    ids_to_crawl = list(dict.fromkeys([i for i in all_ids if i not in done_ids]))
    completed = 0
    batch_sqls = []
    total_to_crawl = len(ids_to_crawl)

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(crawl_single_post, idx): idx for idx in ids_to_crawl}

        for future in as_completed(futures):
            idx = futures[future]
            completed += 1
            try:
                result = future.result()
                if result:
                    _, sql, subject = result
                    with lock:
                        batch_sqls.append(sql)
                        board_state['done_ids'].append(idx)
                        done_ids.add(idx)
            except Exception as e:
                print(f'    [오류] idx={idx}: {e}')

            if completed % 30 == 0 or completed == total_to_crawl:
                with lock:
                    if batch_sqls:
                        with open(sql_file, 'a', encoding='utf-8') as f:
                            f.write('\n'.join(batch_sqls) + '\n')
                        batch_sqls = []
                save_state(state)
                print(f'    {completed}/{total_to_crawl} 완료')

    # Flush remaining
    with lock:
        if batch_sqls:
            with open(sql_file, 'a', encoding='utf-8') as f:
                f.write('\n'.join(batch_sqls) + '\n')

    save_state(state)
    total_done = len(board_state['done_ids'])
    print(f'  완료! 총 {total_done}개 게시물 처리')
    print(f'  SQL 파일: {sql_file}')
    print(f'  이미지 디렉토리: {board_img_dir}')


def main():
    print('남산원 게시판 크롤러 시작')
    print(f'이미지 저장 경로: {IMAGE_DIR}')
    print(f'SQL 저장 경로: {OUTPUT_DIR}')

    state = load_state()

    # Check which boards to crawl (skip if already complete)
    target_boards = BOARDS

    if len(sys.argv) > 1:
        # Allow specific board code as argument
        codes = sys.argv[1:]
        target_boards = [b for b in BOARDS if b['code'] in codes]
        print(f'대상 게시판: {[b["name"] for b in target_boards]}')

    for board in target_boards:
        try:
            crawl_board(board, state)
        except KeyboardInterrupt:
            print('\n크롤링 중단됨. 상태 저장...')
            save_state(state)
            sys.exit(0)
        except Exception as e:
            print(f'게시판 {board["name"]} 오류: {e}')
            import traceback
            traceback.print_exc()
            save_state(state)

    print('\n\n모든 게시판 크롤링 완료!')

    # Summary
    print('\n=== 결과 요약 ===')
    for board in BOARDS:
        code = board['code']
        if code in state:
            total = len(state[code].get('done_ids', []))
            print(f'  {board["name"]:10s}: {total:4d}개 게시물')

    # Count images
    total_images = 0
    for board in BOARDS:
        img_dir = os.path.join(IMAGE_DIR, board['code'])
        if os.path.exists(img_dir):
            files = os.listdir(img_dir)
            total_images += len(files)
            print(f'  {board["name"]:10s} 이미지: {len(files)}개')

    print(f'\n총 이미지: {total_images}개')


if __name__ == '__main__':
    main()
