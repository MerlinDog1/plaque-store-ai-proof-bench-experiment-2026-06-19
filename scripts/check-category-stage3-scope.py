"""Prove stage 3 adds four pages and approved incoming links, with no other live-content changes.
Usage: python3 scripts/check-category-stage3-scope.py BASELINE_DIST RELEASE_DIST REPORT_JSON
Compares full HTML, including schema and hidden content, after only bundle hashes and the exact
three new link paragraphs are normalised. Every other non-bundle file must stay byte-identical,
except sitemap.xml, whose existing entries must be unchanged.
"""
import hashlib
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

baseline, release, output = map(Path, sys.argv[1:])
slugs = ['house-name-plaques', 'donor-recognition-plaques', 'church-plaques', 'professional-brass-plaques']
links = {
    'memorial-plaques': '<a href="/church-plaques">Church pew and dedication plaques</a>',
    'brass-plaques': '<a href="/house-name-plaques">House name plaques</a> · <a href="/professional-brass-plaques">Professional practice plaques</a>',
    'opening-plaques': '<a href="/donor-recognition-plaques">Donor and recognition plaques</a> · <a href="/church-plaques">Church plaques</a>',
}
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

before, after = files(baseline), files(release)
report = {key: [] for key in ['unchanged_html', 'bundle_only', 'links_only', 'unexpected_html', 'metadata_changes', 'other_files_changed']}
for name in sorted(before.keys() & after.keys()):
    if is_bundle(name):
        continue
    if name.endswith('.html'):
        a, b = before[name].read_text(), after[name].read_text()
        na, nb = normalise(a), normalise(b)
        if metadata(a) != metadata(b):
            report['metadata_changes'].append(name)
        slug = name.removesuffix('/index.html')
        if slug in links:
            paragraph = '<p class="memorial-material-links cat-related cat-stage3-links">' + links[slug] + '</p>'
            assert nb.count(paragraph) == 1 and paragraph not in na, f'{slug}: exactly the approved incoming links'
            nb = nb.replace(paragraph, '')
        kind = 'unexpected_html' if na != nb else 'links_only' if slug in links else 'unchanged_html' if a == b else 'bundle_only'
        report[kind].append(name)
    elif name != 'sitemap.xml' and digest(before[name]) != digest(after[name]):
        report['other_files_changed'].append(name)

report['added'] = sorted(name for name in after.keys() - before.keys() if not is_bundle(name))
report['removed'] = sorted(name for name in before.keys() - after.keys() if not is_bundle(name))
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
def sitemap_entries(file):
    return {entry.find('s:loc', ns).text: ET.tostring(entry, encoding='unicode').strip() for entry in ET.parse(file).getroot()}
old_map, new_map = sitemap_entries(before['sitemap.xml']), sitemap_entries(after['sitemap.xml'])
report['sitemap_added'] = sorted(new_map.keys() - old_map.keys())
report['existing_sitemap_entries_unchanged'] = all(new_map.get(url) == entry for url, entry in old_map.items())
report['merchant_feed_identical'] = digest(before['google-merchant-feed.xml']) == digest(after['google-merchant-feed.xml'])
report['new_metadata'] = {slug: metadata(after[f'{slug}/index.html'].read_text()) for slug in slugs}
report['passed'] = (
    not any(report[key] for key in ['unexpected_html', 'metadata_changes', 'other_files_changed', 'removed'])
    and set(report['links_only']) == {f'{slug}/index.html' for slug in links}
    and set(report['added']) == {f'{slug}/index.html' for slug in slugs}
    and set(report['sitemap_added']) == {f'https://instaplaque.co.uk/{slug}' for slug in slugs}
    and report['existing_sitemap_entries_unchanged'] and report['merchant_feed_identical']
)
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: len(value) if isinstance(value, list) else value for key, value in report.items() if key != 'new_metadata'}, indent=2))
if not report['passed']:
    raise SystemExit(1)
