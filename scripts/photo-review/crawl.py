"""Crawl the live InstaPlaque site and list every image each page shows (prerendered <img> tags and the og:image
share card), for the photo review page (owner msg 5967). Writes crawl.json: {path: {"title", "og", "images": [...]}}.
Usage (from the repo): python3 -I scripts/photo-review/crawl.py OUT.json
"""
import html as htmlmod
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

SITE = 'https://instaplaque.co.uk'
EXTRA = ['/', '/design', '/materials', '/how-it-works', '/faq', '/contact', '/about', '/design-request',
         '/portrait-plaques', '/ai-plaque-design', '/plaque-sizes', '/memorial-plaque-wording']


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'InstaPlaque photo review crawl (Cody)', 'Cache-Control': 'no-cache'})
    return urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')


def locs(xml):
    return [u for u in re.findall(r'<loc>([^<]+)</loc>', xml) if not re.search(r'\.(jpe?g|png|webp)(\?|$)', u)]


def page(path):
    text = get(SITE + path)
    root = text[text.find('<div id="root">'):] if '<div id="root">' in text else text
    images = []
    heading = ''
    for match in re.finditer(r'<h[123][^>]*>(.*?)</h[123]>|<img\b([^>]*)>', root, re.S):
        if match.group(1) is not None:
            heading = re.sub(r'<[^>]+>', '', htmlmod.unescape(match.group(1))).strip()[:80]
            continue
        attrs = match.group(2)
        attr = lambda name: htmlmod.unescape((re.search(rf'\b{name}="([^"]*)"', attrs, re.I) or [None, ''])[1])
        images.append({'src': attr('src'), 'srcset': attr('srcset') or attr('srcSet'), 'alt': attr('alt'), 'section': heading})
    og = (re.search(r'<meta property="og:image" content="([^"]+)"', text) or [None, ''])[1]
    title = htmlmod.unescape((re.search(r'<title>(.*?)</title>', text, re.S) or [None, ''])[1]).strip()
    return path, {'title': title, 'og': og, 'images': images}


paths = []
for sitemap in ('/sitemap.xml', '/sitemap-products.xml'):
    for url in locs(get(SITE + sitemap)):
        paths.append(url.replace(SITE, '') or '/')
for path in EXTRA:
    if path not in paths:
        paths.append(path)
with ThreadPoolExecutor(6) as pool:
    results = dict(pool.map(page, paths))
json.dump(results, open(sys.argv[1], 'w'), indent=1)
print(len(results), 'pages;', sum(len(p['images']) for p in results.values()), 'img tags')
