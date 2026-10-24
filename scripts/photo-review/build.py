"""Build the InstaPlaque photo review page (owner msg 5967, 24 Oct 2026: "you literally need to make some way of having
all the photos for the whole site on a page that I can then either tick yes keep it or no redo with space for a
comment").

Takes a crawl of the live site (every <img> and og:image on every page), lists each distinct photo once with where it
is used, and writes a static site for its own Vercel project: index.html (the list inline), small grid thumbnails and
vercel.json. Tapping a photo opens the live full-size file from instaplaque.co.uk with ?r=<content hash>, so it is
always the current one. Decisions are kept on the owner's phone per photo and content hash, so a redone photo comes
back as a new version to check. Numbers never change between builds (numbers.json beside this script). The page sends
the answers to Cody as a prefilled Telegram message.

Usage (from the repo), after every photo change that is live:
  python3 -I scripts/photo-review/crawl.py CRAWL.json
  python3 -I scripts/photo-review/build.py CRAWL.json OUT_DIR   # OUT_DIR's folder name is the Vercel project name
  node scripts/photo-review/test-page.cjs OUT_DIR
  (cd OUT_DIR && vercel deploy --prod --yes --scope dullaghan31-3959s-projects)   # instaplaque-photo-review.vercel.app
Commit numbers.json with the build so each photo keeps its number.
"""
import datetime
import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PUBLIC = REPO / 'public'
WORKSPACE_OUTPUT = Path('/home/coding-agent/workspace/output')
SITE = 'https://instaplaque.co.uk'
THUMB_WIDTH = 480

PAGES = {
    '/': 'Homepage', '/memorial-plaques': 'Memorial', '/bench-plaques': 'Bench', '/garden-plaques': 'Garden',
    '/brass-plaques': 'Brass', '/stainless-steel-plaques': 'Stainless', '/tree-memorial-plaques': 'Tree',
    '/opening-plaques': 'Openings', '/custom-plaques': 'Custom', '/portrait-plaques': 'Portraits',
    '/ai-plaque-design': 'AI design', '/plaque-sizes': 'Sizes', '/memorial-plaque-wording': 'Wording',
    '/materials': 'Materials', '/design': 'Designer', '/how-it-works': 'How it works', '/faq': 'FAQs',
    '/contact': 'Contact', '/about': 'About', '/design-request': 'Design request', '/terms': 'Terms',
    '/privacy': 'Privacy', '/cookies': 'Cookies', '/returns-and-cancellations': 'Returns',
}

SECTIONS = [
    ('tops', 'Top of each page', 'The big photo at the top of each page. On the category pages it shows the plaque the “from” price is for.'),
    ('home', 'Homepage', 'Tiles and photos on the homepage.'),
    ('tiles', 'Tiles and strips on the category pages', 'The “Where will it go?” tiles and the portrait strip.'),
    ('tree', 'Tree page', 'The in-place photos on the memorial tree page.'),
    ('shared', 'Sections on several pages', 'The quality close-up, the sample proof, the AI example and the portrait examples.'),
    ('other', 'Portraits, AI design and materials pages', 'Photos used only on these pages.'),
    ('bench', 'Products: bench plaques', 'Each product page’s photo, with its own example wording. The category and sizes pages show them too.'),
    ('wall', 'Products: wall plaques', 'Metal plaques without wood backing.'),
    ('shapes', 'Products: ovals and circles', ''),
    ('wood', 'Products: on oak or dark wood', 'Plaques with wood backing.'),
    ('share', 'Link previews', 'The picture people see when a page link is shared on WhatsApp, Facebook or Messages.'),
    ('drawings', 'Flat design drawings (optional)', 'The flat drawing on each product page. Google Shopping shows these too.'),
]

# Plaque wording on photos that are not catalogue photos (from the stencils they were made from).
SAYS = {
    '/site-images/category/memorial-hero-v4.webp': 'IN LOVING MEMORY OF / MARGARET ROWLEY / 1936 – 2023 / Mum, Nan and dear friend, / who loved this garden in every season. / Forever in our hearts',
    '/site-images/category/bench-hero.webp': 'In loving memory of / GEORGE HOLLAND / who loved this view',
    '/site-images/category/garden-hero-v2.webp': 'This garden was planted / in loving memory of / SUSAN MARSH / 1951 – 2022 / Where she was happiest',
    '/site-images/category/brass-hero-v2.webp': 'In memory of / FRED & ELSIE BOND / married 1950 / who are remembered here / with love from their family',
    '/site-images/category/stainless-hero.webp': 'Welcome to / THE RIVERSIDE / GARDEN / A community space for everyone / Opened 2026',
    '/site-images/category/tree-hero.webp': 'This cherry tree was planted / in loving memory of / JIM PARTRIDGE / 1947 – 2025 / Every spring, we will think of you',
    '/site-images/category/opening-hero-v2.webp': 'THE MEADOWS / COMMUNITY HUB / was officially opened by / Councillor Jean Mitchell / Mayor of Westbrook / 14 March 2026',
    '/site-images/category/custom-hero-v2.webp': 'HAWTHORN / HOUSE / Built 1898',
    '/site-images/category/route-garden-fence.webp': 'In memory of / BISCUIT / Our gentle cat / 2006 – 2024 / Sunbathing forever',
    '/site-images/category/route-garden-stone-v4.webp': 'IN LOVING MEMORY OF / IVY & SID MOORE / Ivy 1938 – 2021 · Sid 1935 – 2023 / They made this garden together, / and here they rest together.',
    '/site-images/memorial/route-grave-cross-v2.webp': 'ALICE MAY GRANT / 4 June 1933 – 2 March 2021 / Forever in our hearts',
    '/site-images/memorial/route-tree-v3.webp': 'THIS CHERRY TREE WAS PLANTED / IN LOVING MEMORY OF / JIM PARTRIDGE / 1947 – 2025 / Grandad, gardener and teller of tall tales. / Every spring, we think of you',
}

TITLES = {
    '/site-images/category/memorial-hero-v4.webp': 'Memorial page · top photo',
    '/site-images/category/bench-hero.webp': 'Bench page · top photo',
    '/site-images/category/garden-hero-v2.webp': 'Garden page · top photo',
    '/site-images/category/brass-hero-v2.webp': 'Brass page · top photo',
    '/site-images/category/stainless-hero.webp': 'Stainless page · top photo',
    '/site-images/category/tree-hero.webp': 'Tree page · top photo',
    '/site-images/category/opening-hero-v2.webp': 'Openings page · top photo',
    '/site-images/category/custom-hero-v2.webp': 'Custom page · top photo',
    '/site-images/home-gallery-brass-bench.webp': 'Homepage · top photo',
    '/site-images/portraits/pim-millie-detail.webp': 'Portraits page · top photo (real photo)',
    '/site-images/memorial/route-bench.webp': 'Tile · On a bench',
    '/site-images/category/route-garden-stone-v4.webp': 'Tile · In the garden / On a stone',
    '/site-images/memorial/route-tree-v3.webp': 'Tile · By a tree',
    '/site-images/memorial/route-grave-cross-v2.webp': 'Tile · At a grave',
    '/site-images/category/route-garden-fence.webp': 'Tile · On a fence',
    '/site-images/memorial/portrait-george-v3.webp': 'Portrait strip · George (on a stake)',
    '/site-images/memorial/portrait-daniel-v2.webp': 'Portrait strip · Daniel (on a wall)',
    '/site-images/memorial/portrait-bramble-v3.webp': 'Portrait strip · Bramble (workshop)',
    '/site-images/memorial/portrait-ron-pat-v3.webp': 'Portrait strip · Ron & Pat (on a stake)',
    '/site-images/home-route-memorial.webp': 'Homepage phone tile · Memorial',
    '/site-images/home-route-bench.webp': 'Homepage phone tile · Bench',
    '/site-images/home-route-garden.webp': 'Homepage phone tile · Garden',
    '/site-images/home-route-opening.webp': 'Homepage phone tile · Openings',
    '/site-images/home-gallery-aged-brass-wood.webp': 'Homepage · Memorial tile and “Brass or stainless steel?”',
    '/site-images/home-carousel-garden-brass.webp': 'Homepage · Garden tile',
    '/site-images/home-gallery-brass-community.webp': 'Homepage · Openings tile',
    '/site-images/home-gallery-oval-steel.webp': 'Homepage · “Brass or stainless steel?” (steel)',
    '/site-images/quality/real-etched-detail.webp': 'Quality section · close-up (real photo)',
    '/site-images/proof/sample-proof-page-1.webp': 'Sample proof · page 1',
    '/site-images/proof/sample-proof-page-2.webp': 'Sample proof · page 2',
    '/site-images/ai/ai-concept-memorial.webp': 'AI example · the customer’s AI picture (memorial)',
    '/site-images/ai/ai-real-memorial.webp': 'AI example · the plaque we make (memorial)',
    '/site-images/ai/ai-concept-house.webp': 'AI page · the customer’s AI picture (house sign)',
    '/site-images/ai/ai-real-house.webp': 'AI page · the plaque we make (house sign)',
    '/site-images/portraits/pim-millie-photo.webp': 'Portraits · Millie’s photo (real photo)',
    '/site-images/portraits/pim-millie-plaque.webp': 'Portraits · Millie’s finished plaque (real photo)',
    '/site-images/portraits/pim-millie-artwork.webp': 'Portraits · Millie’s artwork',
    '/site-images/portraits/pim-alfie-polished-brass.webp': 'Portraits · Alfie (polished brass)',
    '/site-images/portraits/pim-thomas-polished-steel.webp': 'Portraits · Thomas (polished steel)',
    '/site-images/portraits/pim-lily-brushed-steel.webp': 'Portraits · Lily (brushed steel)',
    '/site-images/portraits/pim-nell-orbital-brass.webp': 'Portraits · Nell (orbital brass)',
    '/site-images/portraits/pim-anne-mahogany-easel.webp': 'Portraits · Anne (on an easel)',
    '/site-images/portraits/pim-willow-aged-brass.webp': 'Portraits · Willowbrook Belle (horse)',
    '/site-images/portraits/pim-ruby-folded-steel.webp': 'Portraits · Ruby (freestanding)',
}

# First matching fragment decides the section of a non-product photo; ORDER sets the order within a section.
SECTION_OF = [
    ('-sq.webp', 'share'), ('/og/', 'share'), ('home-route-', 'home'), ('route-', 'tiles'), ('category/', 'tops'),
    ('home-gallery-brass-bench', 'tops'), ('pim-millie-detail', 'tops'), ('home-', 'home'),
    ('memorial/portrait-', 'tiles'), ('tree-plaque-photos/', 'tree'), ('quality/', 'shared'), ('proof/', 'shared'),
    ('ai-concept-memorial', 'shared'), ('ai-real-memorial', 'shared'), ('pim-millie-photo', 'shared'),
    ('pim-millie-plaque', 'shared'), ('pim-alfie', 'shared'), ('pim-thomas', 'shared'),
    ('portraits/', 'other'), ('ai/', 'other'), ('materials/', 'other'),
]
ORDER = [
    'category/memorial-hero', 'category/bench-hero', 'category/garden-hero', 'category/brass-hero',
    'category/stainless-hero', 'category/tree-hero', 'category/opening-hero', 'category/custom-hero',
    'home-gallery-brass-bench', 'pim-millie-detail',
    'home-route-memorial', 'home-route-bench', 'home-route-garden', 'home-route-opening', 'home-gallery-aged-brass-wood',
    'home-carousel-garden-brass', 'home-gallery-brass-community', 'home-gallery-oval-steel',
    'route-bench', 'route-garden-stone', 'route-tree', 'route-grave', 'route-garden-fence',
    'portrait-george', 'portrait-daniel', 'portrait-joan', 'portrait-bramble', 'portrait-ron',
    'quality/', 'sample-proof-page-1', 'sample-proof-page-2', 'ai-concept-memorial', 'ai-real-memorial',
    'pim-millie-photo', 'pim-millie-plaque', 'pim-alfie', 'pim-thomas',
    'pim-millie-artwork', 'pim-lily', 'pim-nell', 'pim-anne', 'pim-willow', 'pim-ruby', 'ai-concept-house', 'ai-real-house',
    'materials/slider/', 'og/og-home', 'og/og-memorial', 'og/og-bench', 'og/og-garden', 'og/og-brass', 'og/og-stainless',
    '-sq.webp', 'og/og-opening', 'og/og-custom', 'og/og-portrait', 'og/og-ai',
]


def base(src):
    """The photo's identity: the path without query and without a -<width> size suffix."""
    path = src.split('?')[0].replace(SITE, '')
    drawing = re.fullmatch(r'/site-images/merchant/thumbs/(.+)\.webp', path)
    if drawing:
        return f'/site-images/merchant/{drawing[1]}.jpg'
    return re.sub(r'-(\d{3,4})(?=\.(webp|jpe?g|png)$)', '', path)


def page_rank(path):
    return list(PAGES).index(path) if path in PAGES else 99


def local_file(path, cache):
    file = PUBLIC / path.lstrip('/')
    if file.exists():
        return file
    target = cache / path.lstrip('/').replace('/', '__')
    if not target.exists():
        req = urllib.request.Request(SITE + path, headers={'User-Agent': 'InstaPlaque photo review (Cody)'})
        target.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return target


def offer_title(offer):
    shape = f" {offer['shape']}" if offer['shape'] != 'rect' else ''
    bench = ' bench' if offer['format'] == 'Bench' and 'bench' not in offer['label'].lower() else ''
    wood = f" on {'dark wood' if offer['wood'] == 'dark' else 'light oak'}" if offer['wood'] else ''
    price = f"{offer['price']:.2f}".replace('.00', '')
    return f"{offer['label']} {offer['size']}{bench}{shape}{wood} · £{price}"


def product_section(offer):
    if offer['format'] == 'Bench':
        return 'bench'
    if offer['shape'] in ('oval', 'circle'):
        return 'shapes'
    return 'wood' if offer['wood'] else 'wall'


def page_names(paths, own):
    named = list(dict.fromkeys(PAGES[p] for p in sorted(paths, key=page_rank) if p in PAGES))
    products = [p for p in paths if p not in PAGES]
    if products:
        named.append('its product page' if own and products == [f'/{own}'] else
                     f'{len(products)} product pages' if len(products) > 1 else 'a product page')
    return named


def where(paths, own, og):
    shown, shared = page_names(paths, own), page_names(og, own)
    text = 'On: ' + ', '.join(shown) if shown else ''
    if shared:
        listed = ', '.join(shared[:5]) + (f' and {len(shared) - 5} more' if len(shared) > 5 else '')
        text += (' · ' if text else '') + 'Link preview for: ' + listed
    return text


def extra_wording():
    says = {}
    tree = WORKSPACE_OUTPUT / 'instaplaque-tree-scenes-gemini/closeups-wording.json'
    if tree.exists():
        for scene in json.load(open(tree)):
            text = ' / '.join(line[1] for line in scene['lines'] if line[0] != 'gap')
            says[f"/site-images/tree-plaque-photos/{scene['slug']}.webp"] = text
            says[f"/site-images/tree-plaque-photos/{scene['slug']}-sq.webp"] = text
    portraits = WORKSPACE_OUTPUT / 'instaplaque-tree-portraits-pim/variations.json'
    if portraits.exists():
        for variation in json.load(open(portraits)):
            name = variation['slug'].replace('portrait-tree-', 'portrait-')
            text = ' / '.join([variation['name']] + variation['inscription'].split('\n'))
            for suffix in ('', '-v2', '-v3'):
                says[f'/site-images/memorial/{name}{suffix}.webp'] = text
    return says


def main():
    crawl = json.load(open(sys.argv[1]))
    out = Path(sys.argv[2])
    (out / 'thumbs').mkdir(parents=True, exist_ok=True)
    cache = out.parent / 'download-cache'
    cache.mkdir(exist_ok=True)
    offers = json.loads(subprocess.run(['node', str(HERE / 'offers.mjs')], cwd=REPO, capture_output=True, text=True, check=True).stdout)
    slugs = [offer['slug'] for offer in offers]
    by_slug = {offer['slug']: offer for offer in offers}
    by_image = {base(offer['image']): offer for offer in offers if offer['kind'] == 'ai'}
    says_extra = extra_wording()

    uses, og_uses, variants, alts = {}, {}, {}, {}
    for path, page in crawl.items():
        for image in page['images']:
            candidates = [image['src']] + [part.strip().split(' ')[0] for part in image['srcset'].split(',') if part.strip()]
            for src in candidates:
                if src.startswith('/'):
                    variants.setdefault(base(src), set()).add(src.split('?')[0])
            key = base(image['src'])
            uses.setdefault(key, set()).add(path)
            if image['alt'] and key not in alts:
                alts[key] = image['alt']
        if page['og']:
            key = base(page['og'])
            og_uses.setdefault(key, set()).add(path)
            variants.setdefault(key, set()).add(page['og'].replace(SITE, '').split('?')[0])

    items = []
    for key in sorted(variants):
        stem = Path(key).stem
        offer, rank = None, 0
        if key.startswith('/site-images/catalogue-photo/') or key.startswith('/site-images/merchant/'):
            offer = by_slug.get(stem)
        elif key in by_image:
            offer = by_image[key]
        slug = offer['slug'] if offer else None
        if key.startswith('/site-images/merchant/'):
            section, title = 'drawings', ('Drawing · ' + offer_title(offer)) if offer else stem
            rank = slugs.index(slug) if offer else 999
        elif offer:
            section = product_section(offer)
            second = not key.startswith('/site-images/catalogue-photo/') and f'/site-images/catalogue-photo/{slug}.webp' in variants
            title = offer_title(offer) + (' · second photo' if second else '')
            rank = slugs.index(slug) + (0.5 if second else 0)
        else:
            section = next((sec for frag, sec in SECTION_OF if frag in key), 'other')
            rank = next((i for i, frag in enumerate(ORDER) if frag in key), 999)
            title = TITLES.get(key)
            if not title and (key.startswith('/site-images/og/') or key.endswith('-sq.webp')):
                names = page_names(og_uses.get(key, ()), None)
                title = 'Link preview · ' + ', '.join(names[:3]) + (f' and {len(names) - 3} more' if len(names) > 3 else '')
            if not title and key.startswith('/site-images/tree-plaque-photos/'):
                title = 'Tree page · ' + stem.replace('memorial-tree-plaque-', '').replace('-', ' ') + ' photo'
            if not title and key.startswith('/materials/slider/'):
                title = 'Materials page · ' + stem.replace('-', ' ') + ' sample'
            title = title or (alts.get(key) or stem)[:80]
        files = [(src, local_file(src, cache)) for src in sorted(variants[key])]
        sized = sorted(((Image.open(f).size, src, f) for src, f in files), key=lambda entry: entry[0][0])
        (fw, fh), full_src, full_file = sized[-1]
        digest = hashlib.sha256(full_file.read_bytes()).hexdigest()[:10]
        says = SAYS.get(key) or says_extra.get(key) or (' / '.join(offer['words']) if offer and offer['words'] else '')
        page_uses = uses.get(key, set())
        shown_on = page_uses or og_uses.get(key, set())
        link = f'{SITE}/{slug}' if slug else SITE + (sorted(shown_on, key=page_rank)[0] if shown_on else '/')
        items.append({'key': key, 'sec': section, 'title': title, 'where': where(page_uses, slug, og_uses.get(key, ())),
                      'says': says, 'full': f'{SITE}{full_src}?r={digest}', 'fw': fw, 'fh': fh, 'hash': digest,
                      'link': link, 'alt': alts.get(key, title), 'rank': rank, 'src': str(full_file)})

    order = [sec for sec, _, _ in SECTIONS]
    items.sort(key=lambda item: (order.index(item['sec']), item['rank'], item['key']))

    numbers_file = HERE / 'numbers.json'
    numbers = json.load(open(numbers_file)) if numbers_file.exists() else {}
    for item in items:
        if item['key'] not in numbers:
            numbers[item['key']] = max(numbers.values(), default=0) + 1
        item['n'] = numbers[item['key']]
    numbers_file.write_text(json.dumps(numbers, indent=1, sort_keys=True) + '\n')

    for old in (out / 'thumbs').iterdir():
        old.unlink()
    for item in items:
        im = Image.open(item.pop('src'))
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            flat = Image.new('RGB', im.size, (255, 255, 255))
            flat.paste(im, mask=im.split()[-1])
            im = flat
        im = im.convert('RGB')
        if im.width > THUMB_WIDTH:
            im = im.resize((THUMB_WIDTH, round(im.height * THUMB_WIDTH / im.width)), Image.LANCZOS)
        name = f"thumbs/{item['n']}-{item['hash']}.webp"
        im.save(out / name, 'WEBP', quality=74, method=4)
        item.pop('rank')
        item['thumb'], item['tw'], item['th'] = name, im.width, im.height

    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%d %b %Y %H:%M UTC').lstrip('0')
    data = {'built': stamp, 'sections': [{'id': s, 'title': t, 'intro': i, 'collapsed': s == 'drawings'} for s, t, i in SECTIONS],
            'items': items}
    page = (HERE / 'page.html').read_text()
    assert '/*REVIEW_DATA*/null' in page
    page = page.replace('/*REVIEW_DATA*/null', json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
    (out / 'index.html').write_text(page)
    (out / 'manifest.json').write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    (out / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
    (out / 'vercel.json').write_text(json.dumps({'headers': [
        {'source': '/(.*)', 'headers': [{'key': 'X-Robots-Tag', 'value': 'noindex, nofollow'}]},
        {'source': '/', 'headers': [{'key': 'Cache-Control', 'value': 'no-cache'}]},
        {'source': '/index.html', 'headers': [{'key': 'Cache-Control', 'value': 'no-cache'}]},
        {'source': '/thumbs/(.*)', 'headers': [{'key': 'Cache-Control', 'value': 'public, max-age=31536000, immutable'}]},
    ]}, indent=1) + '\n')
    (out / '.vercelignore').write_text('.env*\n.vercel\nmanifest.json\n')
    counts = {}
    for item in items:
        counts[item['sec']] = counts.get(item['sec'], 0) + 1
    print(len(items), 'photos', counts, 'built', stamp)


if __name__ == '__main__':
    main()
