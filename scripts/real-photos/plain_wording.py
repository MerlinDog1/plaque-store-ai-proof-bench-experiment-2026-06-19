"""Plain example wording for the 138 product pages whose photo the owner has not seen (owner msgs 6270, 6281: the
plaque text "doesn't seem natural", too many images to check; plan A in msg 6326). Same rules as the category pages:
memorials are "In loving memory of / NAME / dates", about one in four with one plain extra line; house signs are just
the name; openings and rooms say who opened them and when; no invented towns, stories or jokes. Every name is new
to the site. Deterministic (seeded), so a rerun gives the same wording.
Usage: python3 -I plain_wording.py   -> plain-wording.json (catalogue-wording format, with a "use" per entry)
"""
import json
import random
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
inv = json.load(open(HERE / 'inventory.json'))
offers = json.load(open('/home/coding-agent/workspace/output/instaplaque-garden-real-20261025/offers.json'))
kept = open(HERE / 'kept-text.txt').read().upper()
KEPT_WORDS = set(re.findall(r"[A-Z']+", kept))
rng = random.Random(20261025)

WOMEN = ['Dorothy', 'Patricia', 'Barbara', 'Sheila', 'Brenda', 'Maureen', 'Jean', 'Betty', 'Doreen', 'Eileen', 'Pamela',
         'Sylvia', 'Valerie', 'Audrey', 'Shirley', 'Edna', 'Marjorie', 'Gwen', 'Rita', 'Mavis', 'Joyce', 'Phyllis',
         'Vera', 'Beryl', 'Norma', 'Ann', 'Christine', 'Linda', 'Carol', 'Janet', 'Winifred', 'Muriel', 'Gladys',
         'Olive', 'Edith', 'Nora', 'Freda', 'Hazel', 'Thelma', 'Mabel', 'Peggy', 'Molly', 'Rose', 'Sandra', 'Gillian']
MEN = ['Harold', 'Arthur', 'Albert', 'Ernest', 'Walter', 'Kenneth', 'Ronald', 'Dennis', 'Derek', 'Brian', 'Keith', 'Roy',
       'Leonard', 'Norman', 'Eric', 'Gordon', 'Trevor', 'Malcolm', 'Raymond', 'Colin', 'Alan', 'Geoffrey', 'Douglas',
       'Bernard', 'Gerald', 'Clifford', 'Cyril', 'Victor', 'Frederick', 'Alfred', 'Charles', 'William', 'Edward',
       'Henry', 'Robert', 'Michael', 'Anthony', 'Graham', 'Barry', 'Maurice', 'Leslie', 'Ted', 'Jack', 'Bill', 'Ken']
SURNAMES = ['Cooper', 'Hughes', 'Lawson', 'Shaw', 'Holt', 'Newman', 'Barker', 'Webster', 'Hammond', 'Gibson',
            'Mitchell', 'Spencer', 'Palmer', 'Lowe', 'Dixon', 'Payne', 'Burton', 'Morris', 'Riley', 'Watts', 'Slater',
            'Hodgson', 'Atkinson', 'Kirby', 'Pickering', 'Bradshaw', 'Whitworth', 'Bancroft', 'Lomax', 'Stokes',
            'Rhodes', 'Woodward', 'Sutton', 'Chapman', 'Ingram', 'Goodwin', 'Nicholls', 'Hale', 'Sharpe', 'Ridley',
            'Tanner', 'Godfrey', 'Cartwright', 'Kendall', 'Blake', 'Lambert', 'Pryce', 'Wilkins', 'Fowler', 'Gregory',
            'Haynes', 'Jarvis', 'Kirk', 'Lucas', 'Mason', 'Nash', 'Osborne', 'Porter', 'Reeves', 'Rowe', 'Stone',
            'Thornton', 'Wade', 'Weston', 'Yates', 'Bishop', 'Carr', 'Dale', 'Frost', 'Gill', 'Hurst', 'Kay', 'Lord',
            'Marlow', 'Owen', 'Pratt', 'Rigby', 'Steele', 'Townsend', 'Walsh', 'Wren', 'Hobbs', 'Brook', 'Platt',
            'Abbott', 'Barlow', 'Bowen', 'Chadwick', 'Clegg', 'Crowther', 'Dunn', 'Eaton', 'Fairbairn', 'Garside',
            'Heywood', 'Hollins', 'Lindley', 'Marsden', 'Moss', 'Naylor', 'Oldfield', 'Pollard', 'Ramsden',
            'Royle', 'Schofield', 'Senior', 'Swales', 'Tattersall', 'Unwin', 'Varley', 'Wainwright', 'Whiteley',
            'Ackroyd', 'Beck', 'Collier', 'Dearden', 'Earnshaw', 'Fenby', 'Greenwood', 'Haigh', 'Illingworth']
PETS = ['BONNIE', 'MAX', 'RUBY', 'BRUNO', 'TILLY', 'ROSIE', 'BEN', 'POPPY', 'JASPER', 'MEG', 'ALFIE', 'BELLA', 'BUSTER',
        'LUNA', 'TESS', 'MILO', 'HONEY', 'BARNEY', 'CHARLIE', 'DAISY', 'PIPER', 'SAM']
HOUSES = [('ROSE', 'COTTAGE'), ('WILLOW', 'HOUSE'), ('THE', 'STABLES'), ('ORCHARD', 'HOUSE'), ('FERN', 'COTTAGE'),
          ('THE OLD', 'BAKERY'), ('MILL', 'HOUSE'), ('BEECH', 'COTTAGE'), ('THE', 'GRANGE'), ('LARCH', 'HOUSE')]
ROOMS = ['THE GARDEN ROOM', 'THE MUSIC ROOM', 'THE QUIET ROOM', 'THE STUDIO', 'THE ART ROOM', 'THE FAMILY ROOM',
         'THE LIBRARY', 'THE SUN ROOM']
BUILDINGS = [('THE NEW', 'PAVILION'), ('THE VILLAGE', 'HALL'), ('THE SENSORY', 'GARDEN'), ('THE SCOUT', 'HUT'),
             ('THE', 'BOATHOUSE'), ('THE YOUTH', 'CENTRE'), ('THE NEW', 'CLUBHOUSE'), ('THE', 'WALLED GARDEN')]
TREES = ['This tree was planted', 'This oak was planted', 'This cherry tree was planted', 'This rowan was planted',
         'This beech was planted', 'This tree was planted']
EXTRA_PERSON = {'f': ['Forever in our hearts', 'Much loved Mum and Nan', 'Always in our thoughts', 'Loved and remembered'],
                'm': ['Forever in our hearts', 'Much loved Dad and Grandad', 'Always in our thoughts', 'Loved and remembered']}
EXTRA_BENCH = ['Sit and rest awhile', 'Forever in our hearts', 'Rest awhile', 'Who loved this place']
EXTRA_COUPLE = ['Together again', 'Reunited']
EXTRA_PET = ['Our faithful friend', 'Always by our side', 'Our best friend']
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'September', 'October', 'November']


LIMIT = {'first': 2, 'last': 2, 'misc': 1}


def fresh(pool, used, kind='misc'):
    """A random entry of the pool that is not on the site yet. First names may repeat up to three times and
    surnames twice in this batch (common names do), but never as the same full name; other pools never repeat."""
    options = [p for p in pool if used.get(p.upper(), 0) < LIMIT[kind] and p.upper() not in KEPT_WORDS]
    pick = rng.choice(options)
    used[pick.upper()] = used.get(pick.upper(), 0) + 1
    return pick


used_first, used_last, used_misc, used_full = {}, {}, {}, set()
tree_count, pet_count, room_count = [0], [0], [0]


FAMOUS = {('Robert', 'Owen'), ('William', 'Morris'), ('Robert', 'Palmer'), ('Henry', 'Moore'), ('Barry', 'Sheene')}


def person(short=False):
    gender = rng.choice('fm')
    while True:
        first = fresh([x for x in (WOMEN if gender == 'f' else MEN) if not short or len(x) <= 6], used_first, 'first')
        last = fresh(SURNAMES, used_last, 'last')
        if (first, last) not in used_full and (first, last) not in FAMOUS:
            used_full.add((first, last))
            break
    born = rng.randint(1922, 1950)
    died = rng.randint(max(born + 62, 2006), min(born + 97, 2024))
    return gender, first, last, f'{born} – {died}'


def opened():
    return f'{rng.randint(2, 28)} {rng.choice(MONTHS)} {rng.randint(2023, 2025)}'


def entry(slug, lines, use):
    return {'slug': slug, 'offer': slug, 'overrides': {}, 'lines': lines, 'use': use}


def bench(slug, o, n):
    """In loving memory of / NAME / dates; couples on the 200 x 50; one line more on about one in four taller plates."""
    if o['width'] == 200 and o['height'] == 50 and n % 2 == 1:
        g1, f1, last, d1 = person(short=True)
        g2 = 'f' if g1 == 'm' else 'm'
        f2 = fresh([x for x in (WOMEN if g2 == 'f' else MEN) if len(x) <= 6 and x[:4] != f1[:4]], used_first, 'first')
        b1 = int(d1[:4])
        b2 = rng.randint(b1 - 5, b1 + 5)
        d2 = f'{b2} – {rng.randint(max(b2 + 62, 2000), min(b2 + 95, 2024))}'
        return entry(slug, [['intro', 'In loving memory of'], ['name', f'{f1.upper()} & {f2.upper()} {last.upper()}'],
                            ['date', f'{f1} {d1} · {f2} {d2}']], 'bench')
    g, first, last, dates = person()
    lines = [['intro', 'In loving memory of'], ['name', f'{first.upper()} {last.upper()}'], ['date', dates]]
    if o['height'] >= 65 and n % 4 == 2:
        lines.append(['body', EXTRA_BENCH[n // 4 % len(EXTRA_BENCH)]])
    return entry(slug, lines, 'bench')


def split_name(first, last, tall):
    return [['name', first.upper()], ['name', last.upper()]] if tall else [['name', f'{first.upper()} {last.upper()}']]


def make(slug, o, kind, n):
    tall = o['height'] > o['width'] or (o['width'] >= 400)
    if kind == 'memorial':
        g, first, last, dates = person()
        lines = [['intro', 'In loving memory of']] + split_name(first, last, tall) + [['date', dates]]
        if n % 4 == 1:
            lines.append(['body', rng.choice(EXTRA_PERSON[g])])
        return entry(slug, lines, 'memorial')
    if kind == 'couple':
        g1, f1, last, d1 = person()
        g2 = 'f' if g1 == 'm' else 'm'
        f2 = fresh([x for x in (WOMEN if g2 == 'f' else MEN) if x[:4] != f1[:4]], used_first, 'first')
        b1 = int(d1[:4])
        b2 = rng.randint(b1 - 5, b1 + 5)
        d2 = f'{b2} – {rng.randint(max(b2 + 62, 2000), min(b2 + 95, 2024))}'
        lines = [['intro', 'In loving memory of'], ['name', f'{f1.upper()} & {f2.upper()}'], ['name', last.upper()],
                 ['date', f'{f1} {d1}'], ['date', f'{f2} {d2}']]
        if n % 3 == 0:
            lines.append(['body', rng.choice(EXTRA_COUPLE)])
        return entry(slug, lines, 'memorial')
    if kind == 'tree':
        g, first, last, dates = person()
        tree_count[0] += 1
        return entry(slug, [['intro', TREES[tree_count[0] % len(TREES)]], ['intro', 'in loving memory of']]
                     + split_name(first, last, tall) + [['date', dates]], 'tree')
    if kind == 'pet':
        name = fresh([p.title() for p in PETS], used_misc).upper()
        born = rng.randint(2006, 2012)
        lines = [['intro', 'In loving memory of'], ['name', name], ['date', f'{born} – {rng.randint(born + 11, 2024)}']]
        pet_count[0] += 1
        if pet_count[0] % 2 == 0:
            lines.append(['body', EXTRA_PET[pet_count[0] // 2 % len(EXTRA_PET)]])
        return entry(slug, lines, 'pet')
    if kind == 'house':
        a, b = rng.choice([h for h in HOUSES if ' '.join(h) not in used_misc])
        used_misc[' '.join((a, b))] = 1
        return entry(slug, [['name', a], ['name', b]], 'house')
    if kind == 'room':
        free = [r for r in ROOMS if r not in used_misc]
        room_count[0] += 1
        if free and room_count[0] % 2 == 1:
            room = rng.choice(free)
            used_misc[room] = 1
            words = room.split(' ')
            name_lines = [['name', ' '.join(words[:-1])], ['name', words[-1]]] if tall and len(words) > 2 else [['name', room]]
        else:
            # A room named after someone, like the Arthur Lee Room on the opening page.
            g, first, last, _ = person()
            name_lines = [['name', f'THE {first.upper()} {last.upper()}'], ['name', 'ROOM']]
        return entry(slug, name_lines + [['date', f'Opened on {opened()}']], 'opening')
    if kind == 'opening':
        a, b = rng.choice([x for x in BUILDINGS if ' '.join(x) not in used_misc])
        used_misc[' '.join((a, b))] = 1
        g, first, last, _ = person()
        return entry(slug, [['name', a], ['name', b], ['intro', 'was officially opened by'],
                            ['body', f'{first} {last}'], ['date', f'on {opened()}']], 'opening')
    raise ValueError(kind)


# Kinds per setting, in turn within each size: wood boards are indoors or sheltered, so rooms and memorials; plates
# without a board also go on houses, gates and posts by trees. House signs only on the usual house-sign sizes.
METAL = ['memorial', 'tree', 'memorial', 'house', 'pet', 'memorial', 'couple', 'opening']
WOOD = ['memorial', 'room', 'couple', 'memorial', 'pet', 'memorial', 'memorial', 'memorial']
SHAPED = ['house', 'memorial', 'pet', 'tree']
HOUSE_SIZES = {(200, 150), (210, 148), (300, 200), (297, 210), (250, 150), (200, 200)}
OPENING_SIZES = {(297, 210), (300, 200), (400, 300), (210, 297)}

out = []
by_size = {}
for slug in inv['unvetted']:
    o = offers[slug]
    by_size.setdefault((o['width'], o['height'], o['shape']), []).append(slug)
for (w, h, shape), slugs in sorted(by_size.items()):
    bench_size = h <= 75 and w / h >= 2
    for n, slug in enumerate(slugs):
        o = offers[slug]
        if bench_size:
            out.append(bench(slug, o, n))
            continue
        cycle = SHAPED if shape != 'rect' else (WOOD if o['wood'] else METAL)
        kind = cycle[n % len(cycle)]
        if kind == 'house' and (w, h) not in HOUSE_SIZES:
            kind = 'memorial'
        if kind == 'opening' and (w, h) not in OPENING_SIZES:
            kind = 'tree'
        if kind == 'couple' and w < 200:
            kind = 'memorial'
        if kind == 'pet' and w * h > 297 * 210:
            kind = 'memorial'
        out.append(make(slug, o, kind, n))



def tidy(e, o):
    """Fix layouts that came out small in the first drawings (no random draws, so the names stay the same): long room
    names, long tree names and long single-line names on bigger landscape plates go over two lines; circles and ovals
    take the plain memorial form instead of the long tree wording."""
    lines = e['lines']
    portrait = o['height'] > o['width']
    bench_size = o['height'] <= 75 and o['width'] / o['height'] >= 2
    names = [t for r, t in lines if r == 'name']
    rest = [l for l in lines if l[0] != 'name']
    first_name_at = next(i for i, l in enumerate(lines) if l[0] == 'name') if names else None
    if e['use'] == 'opening' and len(names) == 2 and names[1] == 'ROOM' and len(names[0]) > 12:
        parts = names[0].split(' ')
        if len(parts) == 3:
            new = [' '.join(parts[:2]), parts[2], 'ROOM'] if portrait else [' '.join(parts[:2]), parts[2] + ' ROOM']
            e['lines'] = [['name', n] for n in new] + rest
        return e
    if e['use'] == 'tree' and o['shape'] != 'rect':
        name = ' '.join(names).split(' ')
        e['lines'] = [['intro', 'In loving memory of'], ['name', name[0]], ['name', ' '.join(name[1:])]] + [l for l in rest if l[0] == 'date']
        e['use'] = 'memorial'
        return e
    if e['use'] in ('memorial', 'tree') and not bench_size and o['shape'] == 'rect' and len(names) == 1 and len(names[0]) > 14 and ' ' in names[0] and '&' not in names[0]:
        first, last = names[0].split(' ', 1)
        e['lines'] = lines[:first_name_at] + [['name', first], ['name', last]] + lines[first_name_at + 1:]
    return e


out = [tidy(e, offers[e['slug']]) for e in out]
json.dump(out, open(HERE / 'plain-wording.json', 'w'), indent=1, ensure_ascii=False)
counts = {}
for e in out:
    counts[e['use']] = counts.get(e['use'], 0) + 1
print(len(out), 'wordings', counts)
for e in out:
    print(f"{e['slug'].replace('-rect-plaque', '').replace('-plaque', ''):48} {e['use']:9} | "
          + ' / '.join(t for _, t in e['lines']))
