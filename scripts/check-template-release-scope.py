"""Compare a release build against ec24ba1: only eight route bodies and the shared notice may change.
Usage: python3 scripts/check-template-release-scope.py BASELINE_DIST RELEASE_DIST REPORT_JSON
Hash-named JS/CSS bundles are inventoried, not byte-compared. Every other file is compared.
"""
import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path

ref, release, output = map(Path, sys.argv[1:])
slugs = ['memorial-plaques', 'bench-plaques', 'garden-plaques', 'tree-memorial-plaques',
         'brass-plaques', 'stainless-steel-plaques', 'opening-plaques', 'custom-plaques']
expected = set() if os.environ.get('TEMPLATE_SWITCHES_OFF') == '1' else {'/' + slug for slug in slugs}
banner = re.compile(r'<section id="static-cookie-banner"[\s\S]*?</section>')
asset = re.compile(r'(/assets/[^\s"<>]*?)-[A-Za-z0-9_-]{8}(\.(?:js|css))')

def normalize(text):
    return asset.sub(r'\1-HASH\2', text)

def route(file):
    return '/' + file[:-len('index.html')].rstrip('/') if file.endswith('index.html') else '/' + file

def files(folder):
    return {p.relative_to(folder).as_posix(): p for p in folder.rglob('*') if p.is_file()}

def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

def metadata(text):
    def match(pattern):
        found = re.search(pattern, text)
        return html.unescape(re.sub('<[^>]+>', '', found[1])) if found else None
    return {'title': match(r'<title>([\s\S]*?)</title>'),
            'description': match(r'<meta name="description" content="([^"]*)"'),
            'h1': match(r'<h1[^>]*>([\s\S]*?)</h1>'),
            'canonical': match(r'<link rel="canonical" href="([^"]*)"')}

before, after = files(ref), files(release)
is_bundle = lambda name: name.startswith('assets/') and bool(re.search(r'-[A-Za-z0-9_-]{8}\.(js|css)$', name))
result = {key: [] for key in ['unchanged_html', 'bundle_only', 'notice_only', 'content', 'other_files_changed', 'added', 'removed']}
for file in sorted(before.keys() & after.keys()):
    if is_bundle(file):
        continue
    if file.endswith('.html'):
        a, b = before[file].read_text(), after[file].read_text()
        na, nb = normalize(a), normalize(b)
        kind = 'unchanged_html' if a == b else 'bundle_only' if na == nb else 'notice_only' if banner.sub('', na) == banner.sub('', nb) else 'content'
        result[kind].append(route(file))
    elif digest(before[file]) != digest(after[file]):
        result['other_files_changed'].append(file)
result['added'] = sorted(file for file in after.keys() - before.keys() if not is_bundle(file))
result['removed'] = sorted(file for file in before.keys() - after.keys() if not is_bundle(file))
result['bundles'] = {'before': sorted(file for file in before if is_bundle(file)), 'after': sorted(file for file in after if is_bundle(file))}
result['metadata'] = {}
for slug in slugs:
    file = slug + '/index.html'
    a, b = metadata(before[file].read_text()), metadata(after[file].read_text())
    result['metadata']['/' + slug] = {'same': a == b, 'reference': a, 'release': b}
result['sitemap_identical'] = before['sitemap.xml'].read_bytes() == after['sitemap.xml'].read_bytes()
result['reference_files'] = len(before)
result['release_files'] = len(after)
result['passed'] = (set(result['content']) == expected and not result['other_files_changed'] and not result['removed']
                    and len(result['added']) == 16 and all(file.startswith('site-images/finish/') and file.endswith('.webp') for file in result['added'])
                    and result['sitemap_identical'] and all(item['same'] for item in result['metadata'].values()))
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: (len(value) if isinstance(value, list) else value) for key, value in result.items() if key not in ['bundles', 'metadata']}))
if not result['passed']:
    print('Unexpected content routes:', sorted(set(result['content']) - expected))
    print('Changed non-HTML:', result['other_files_changed'])
    raise SystemExit(1)
