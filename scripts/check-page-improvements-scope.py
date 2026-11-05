"""Prove the page-1 improvements (owner msg 10173, 5 Nov 2026) change only the five pages they are for.
Usage: python3 scripts/check-page-improvements-scope.py BASELINE_DIST RELEASE_DIST REPORT_JSON
BASELINE_DIST is a build of the release's parent (live source + stage 3). Full HTML is compared, schema and hidden
content included, after normalising only bundle hashes:
- garden, brass, stainless steel and opening may change; their titles and canonicals may not, and only the garden
  page's H1 may;
- the tree page may change only its summary: with the old and new summaries normalised, it must be identical;
- every other page differs at most in bundle hashes, and every other non-bundle file (sitemap, robots, feed) is
  byte-identical; no file is added or removed.
"""
import hashlib
import html
import json
import re
import sys
from pathlib import Path

baseline, release, output = map(Path, sys.argv[1:])
changed = ['garden-plaques', 'brass-plaques', 'stainless-steel-plaques', 'opening-plaques']
summary_only = ['tree-memorial-plaques']
asset = re.compile(r'(/assets/[^\s"<>]*?)-[A-Za-z0-9_-]{8}(\.(?:js|css))')
is_bundle = lambda name: name.startswith('assets/') and bool(re.search(r'-[A-Za-z0-9_-]{8}\.(js|css)$', name))
files = lambda folder: {p.relative_to(folder).as_posix(): p for p in folder.rglob('*') if p.is_file()}
digest = lambda file: hashlib.sha256(file.read_bytes()).hexdigest()
normalise = lambda text: asset.sub(r'\1-HASH\2', text)


def metadata(text):
    def match(pattern):
        found = re.search(pattern, text)
        return html.unescape(re.sub('<[^>]+>', '', found[1])) if found else None
    return {
        'title': match(r'<title>([\s\S]*?)</title>'),
        'description': match(r'<meta name="description" content="([^"]*)"'),
        'h1': match(r'<h1[^>]*>([\s\S]*?)</h1>'),
        'canonical': match(r'<link rel="canonical" href="([^"]*)"'),
    }


def without_summary(text, summary):
    """The page with every form of its summary (attribute-escaped, plain and JSON) replaced by one marker."""
    forms = {summary, html.escape(summary, quote=True), html.escape(summary, quote=False), json.dumps(summary)[1:-1]}
    for form in sorted(forms, key=len, reverse=True):
        text = text.replace(form, '@@SUMMARY@@')
    return text


before, after = files(baseline), files(release)
report = {key: [] for key in ['unchanged_html', 'bundle_only', 'improved', 'summary_only', 'unexpected_html', 'other_files_changed']}
report['metadata'] = {}
for name in sorted(before.keys() & after.keys()):
    if is_bundle(name):
        continue
    if not name.endswith('.html'):
        if digest(before[name]) != digest(after[name]):
            report['other_files_changed'].append(name)
        continue
    a, b = before[name].read_text(), after[name].read_text()
    na, nb = normalise(a), normalise(b)
    slug = name.removesuffix('/index.html')
    ma, mb = metadata(a), metadata(b)
    if slug in changed + summary_only:
        report['metadata'][slug] = {key: {'before': ma[key], 'after': mb[key]} for key in ma if ma[key] != mb[key]}
        allowed = {'description', 'h1'} if slug == 'garden-plaques' else {'description'}
        if set(report['metadata'][slug]) - allowed or 'description' not in report['metadata'][slug]:
            report['unexpected_html'].append(name)
        elif slug in summary_only:
            same = without_summary(na, ma['description']) == without_summary(nb, mb['description'])
            report['summary_only' if same else 'unexpected_html'].append(name)
        else:
            report['improved'].append(name)
        continue
    kind = 'unchanged_html' if a == b else 'bundle_only' if na == nb else 'unexpected_html'
    report[kind].append(name)

report['added'] = sorted(name for name in after.keys() - before.keys() if not is_bundle(name))
report['removed'] = sorted(name for name in before.keys() - after.keys() if not is_bundle(name))
report['passed'] = (
    not any(report[key] for key in ['unexpected_html', 'other_files_changed', 'added', 'removed'])
    and set(report['improved']) == {f'{slug}/index.html' for slug in changed}
    and set(report['summary_only']) == {f'{slug}/index.html' for slug in summary_only}
)
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({key: len(value) if isinstance(value, list) else value for key, value in report.items() if key != 'metadata'}, indent=2))
print(json.dumps({key: value for key, value in report.items() if key in ('unexpected_html', 'other_files_changed', 'added', 'removed') and value}, indent=2))
if not report['passed']:
    raise SystemExit(1)
