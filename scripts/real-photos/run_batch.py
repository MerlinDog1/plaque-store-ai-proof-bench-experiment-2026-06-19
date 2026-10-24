"""Make the photos in jobs.json on Codex (gpt-image-2, ChatGPT subscription) through the OpenClaw CLI, one at a time.
Each call peaks at about 400 MB, so run this inside one cody-job and never two at once. Resumable: finished versions
are skipped. Saves out/<id>.v<N>.jpg (q95; the disk is near its reserve) and appends to out/log.jsonl.
Usage: python3 -I run_batch.py [id ...]
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
CLI = '/home/coding-agent/.local/bin/openclaw'
OUT = HERE / 'out'
OUT.mkdir(exist_ok=True)


def log(record):
    record['time'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    with open(OUT / 'log.jsonl', 'a') as f:
        f.write(json.dumps(record) + '\n')
    print(json.dumps(record), flush=True)


def main():
    only = set(sys.argv[1:])
    jobs = [j for j in json.loads((HERE / os.environ.get('JOBS', 'jobs.json')).read_text()) if not only or j['id'] in only]
    for job in jobs:
        prompt = (HERE / 'prompts' / f"{job['id']}.txt").read_text()
        for v in range(1, job['versions'] + 1):
            jpg = OUT / f"{job['id']}.v{v}.jpg"
            if jpg.exists():
                continue
            if (HERE / 'STOP').exists():
                log({'id': job['id'], 'v': v, 'status': 'stopped'})
                return
            png = OUT / f"{job['id']}.v{v}.png"
            cmd = [CLI, 'infer', 'image', 'edit', '--file', job['ref'], '--prompt', prompt, '--model', 'openai/gpt-image-2',
                   '--size', job['size'], '--quality', 'high', '--output-format', 'png', '--output', str(png), '--json',
                   '--timeout-ms', '540000'] + (['--openai-moderation', job['moderation']] if job.get('moderation') else [])
            started = time.time()
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=620)
                result = json.loads(res.stdout or '{}')
            except subprocess.TimeoutExpired:
                result = {'ok': False, 'error': {'message': 'CLI timed out after 620 s'}}
            except json.JSONDecodeError:
                result = {'ok': False, 'error': {'message': (res.stderr or res.stdout or '')[-300:]}}
            secs = round(time.time() - started)
            if result.get('ok') and png.exists():
                im = Image.open(png).convert('RGB')
                im.save(jpg, quality=95, subsampling=0)
                png.unlink()
                log({'id': job['id'], 'v': v, 'status': 'done', 'size': im.size, 'secs': secs})
            else:
                message = str((result.get('error') or {}).get('message', 'unknown error'))[:300]
                log({'id': job['id'], 'v': v, 'status': 'error', 'secs': secs, 'error': message})
                if any(k in message.lower() for k in ('429', 'rate limit', 'usage limit', 'quota', 'too many')):
                    log({'status': 'paused: usage or rate limit; stopping the run'})
                    return
            time.sleep(2)
    log({'status': 'finished'})


if __name__ == '__main__':
    main()
