"""The 16 newer photos on the memorial page, redone as real-looking photos (owner msg 6056, 24 Oct 2026:
"start with memorial page replace all newish images, you really need to sense check content, layout, placement etc.
Make up a back story for the plaque if you must").

Each entry: the slot it fills, a back story (invented; no real people), the plaque (material, size, board, border,
fixings), the wording, where and how the plaque is mounted, the light and the camera. Wording is fuller and personal,
in the style of the site's original June photos (owner msg 5992). Wall plaques on wood use the scalloped border
(owner msg 6001). Tree plaques keep the A5-on-oak-board-and-stake mount (owner msg 5762).
design: 'coded' = my SVG (coded.py), 'designer' = the site's designer (stencil-app), 'pim' = Portraits in Metal's
own artwork for the portraits (owner msg 5816).
"""

SPECS = [
    # ---------------------------------------------------------------- top photo
    dict(id='hero', slot='category/memorial-hero-v3', design='coded', aspect='3:2', versions=3,
         story="Margaret Rowley (1936-2023) kept the same long back garden for fifty years. The spring after she died, her "
               "children fixed a plaque on the old brick wall beside her favourite climbing rose.",
         plate=dict(w=210, h=148, material='brushed-stainless', text='black', board='dark', border='scalloped', fixing='caps4', cap=10),
         lines=[('intro', 'IN LOVING MEMORY OF'), ('name', 'MARGARET ROWLEY'), ('date', '1936 – 2023'),
                ('gap', ''), ('body', 'Mum, Nan and dear friend,'), ('body', 'who loved this garden in every season.'),
                ('small', 'Forever in our hearts')],
         scene="The plaque on its board is fixed flat to the weathered red-brick wall of an ordinary English back garden, "
               "with hidden fixings, about chest height. The bricks are uneven and worn, the mortar a little crumbly, with "
               "patches of moss and pale lichen. A climbing rose with a few open pink blooms and some tired leaves grows up "
               "the wall just to the right; its leaves throw soft dappled shadows across the wall and over the right-hand "
               "side of the plaque. Below, softly out of focus, an untidy cottage flowerbed. Late-afternoon sun from the "
               "left, low and warm.",
         camera="about 80 cm from the wall, standing slightly to the right of the plaque and a little above it, so the "
                "plaque is seen at a gentle angle of about 15 degrees; the bevelled edge of the board shows on one side. The "
                "plaque sits just left of centre and takes up about 45% of the frame width, with nothing important near the "
                "left and right edges. The whole plaque face is sharp and readable; the wall softens towards the edges.",
         scale="The bricks are standard UK bricks, long and low: each brick face is about three times as long as it is tall "
               "(215 x 65 mm), in stretcher bond with 10 mm joints. The board (235 x 173 mm) is just over ONE brick long and "
               "just over TWO courses tall. It must not look any bigger than that."),

    # ---------------------------------------------------------------- "Where will it go?" tiles
    dict(id='tile-stone', slot='category/route-garden-stone-v3', design='coded', aspect='3:2', versions=2,
         story="Ivy and Sid Moore made their cottage garden together over forty years. Their ashes were scattered in the "
               "border, and their grandchildren fixed a brass plaque to the big sandstone boulder Sid dug out when he made the pond.",
         plate=dict(w=200, h=150, material='brushed-brass', text='black', board=None, border='double', fixing='caps4', cap=10),
         lines=[('intro', 'IN LOVING MEMORY OF'), ('name', 'IVY & SID MOORE'), ('date', 'Ivy 1938 – 2021   ·   Sid 1935 – 2023'),
                ('gap', ''), ('body', 'They made this garden together,'), ('body', 'and here they rest together.')],
         scene="The brushed brass plaque is fixed with its four caps onto the broad, slightly sloping flat face of a large "
               "weathered sandstone boulder, about 70 cm across, that sits in a cottage-garden border. Soft lady's mantle, "
               "catmint and a pink rose spill around the stone; a few fallen petals lie on it. Gentle morning light from the "
               "left, with soft shadows.",
         camera="about 50 cm from the stone, a little above it and slightly to one side, looking down at the plaque at about "
                "30 degrees so the whole face reads clearly. The plaque takes up about 40% of the frame width, a little left of "
                "centre, with the stone and the planting around it. The plaque is sharp; the border behind falls softly out of focus.",
         scale="The plaque is 200 x 150 mm, about the size of a postcard and a half; the boulder is about 70 cm across, so the "
               "plaque covers only a small part of its face."),

    dict(id='tile-tree', slot='memorial/route-tree-v2', design='coded', aspect='3:2', versions=2,
         story="Jim Partridge loved his garden. His family planted a flowering cherry where he used to sit with his tea, and "
               "the plaque stands at its foot on its own oak board and stake.",
         plate=dict(w=210, h=148, material='brushed-brass', text='black', board='light', border='scalloped', fixing='caps4', cap=10),
         lines=[('intro', 'THIS CHERRY TREE WAS PLANTED'), ('intro', 'IN LOVING MEMORY OF'), ('name', 'JIM PARTRIDGE'),
                ('date', '1947 – 2025'), ('gap', ''), ('body', 'Grandad, gardener and teller of tall tales.'),
                ('small', 'Every spring, we think of you')],
         scene="The plaque on its light oak board is held upright by ONE chunky black powder-coated steel ground stake, a "
               "solid square bar about 30 mm thick, fixed by a bracket to the middle of the back of the board and pushed "
               "straight down into the ground. Nothing else holds it. It stands in fresh bark mulch at the foot of a young "
               "flowering cherry tree in a back garden: the tree's slim trunk, about 4 cm thick, with a black rubber tree tie "
               "and a wooden support stake, rises just behind the board on its right; a few sprigs of pale pink blossom reach "
               "into the top of the frame and some petals have fallen on the mulch and on the top edge of the board. A lawn "
               "is softly blurred behind. Bright, soft spring morning light.",
         camera="close and low: about 60 cm away at the height of the board, looking at it almost straight on, 85 mm lens. "
                "The board fills about 55% of the frame width; below it the black stake runs into the mulch at the bottom of the "
                "frame. Everything behind the plaque and the trunk is softly out of focus.",
         scale="The oak board is only 235 x 173 mm, the size of a hardback book; the cherry trunk is about 4 cm thick. "
               "Keep it true to that size."),

    dict(id='tile-grave', slot='memorial/route-grave-cross-v2', design='coded', aspect='3:2', versions=2,
         story="Alice Grant is buried in her village churchyard. While the ground settles before the headstone can go up, the "
               "family put up a plain oak cross with a small polished brass name plate screwed to its arm.",
         plate=dict(w=150, h=50, material='polished-brass', text='black', board=None, border='single', fixing='screws2', cap=5),
         lines=[('name', 'ALICE MAY GRANT'), ('date', '4 June 1933 – 2 March 2021'), ('small', 'Forever in our hearts')],
         scene="A plain light oak memorial cross, about 90 cm tall, made of square oak section 100 mm wide, stands at the head "
               "of a grave in an old village churchyard. The small polished brass plate is screwed with two small brass "
               "screws to the middle of the front of the cross's horizontal arm, and sits completely inside that 100 mm-deep "
               "face with a clear margin of oak above and below it: no part of it overhangs any edge. In front of the cross, "
               "a small grave vase with fresh white and yellow flowers on the grass. Old headstones, a yew tree and the "
               "church wall are softly blurred behind. Soft, bright overcast daylight. Calm and respectful.",
         camera="at the height of the cross arm, about 70 cm away and slightly to one side; the arm of the cross and its brass "
                "plate sit a little above centre, the plate about 25% of the frame width. The plate is sharp; the churchyard "
                "behind is softly out of focus.",
         scale="The brass plate is only 150 x 50 mm, a little bigger than a mobile phone lying on its side; the cross arm is "
               "100 mm deep, twice the height of the plate."),
]

# ---------------------------------------------------------------- the 8 product photos (picks on the memorial page)
# design='designer': the site's own designer draws the plate from the product preset, so the photo, the flat drawing
# and the sample PDF all show the same plaque. Wood-backed: scalloped border (owner msg 6001).
PRODUCTS = [
    dict(id='aged-brass-210x148-rect-plaque', overrides={},
         story="James Ormerod was a railway signalman, then spent his retirement volunteering on a heritage railway. The "
               "railway society fixed his plaque on the platform wall next to the old signal box.",
         lines=[('intro', 'In loving memory of'), ('name', 'JAMES ORMEROD'), ('date', '1941 – 2019'), ('gap', ''),
                ('body', 'Signalman, volunteer and friend,'), ('body', 'who kept this little station running'),
                ('small', 'for forty happy years')],
         scene="The aged brass plaque is fixed with its four caps to the old red-brick wall of a small heritage railway "
               "station platform, at head height, beside a green-painted wooden door. A hanging basket of trailing flowers, "
               "the cream and green painted platform canopy and its cast-iron bracket are softly blurred above and beside it. "
               "Soft daylight under the canopy.",
         camera="at eye level, about 90 cm away, slightly to the left, so the plaque is seen at a gentle angle of about 15 "
                "degrees. The plaque takes up about 40% of the frame width.",
         scale="A5 plate (210 x 148 mm): about one brick long and two brick courses tall (bricks 215 x 65 mm, long and low)."),
    dict(id='polished-brass-250x150-oval-plaque', overrides={},
         story="Irene Baxter arranged the flowers at St Peter's church for more than fifty years. The parish fixed an oval "
               "brass plaque in the church porch, beside where her flowers still stand every Sunday.",
         lines=[('intro', 'In loving memory of'), ('name', 'IRENE BAXTER'), ('date', '1933 – 2022'), ('gap', ''),
                ('body', 'who arranged the flowers here'), ('small', 'for more than fifty years')],
         scene="The polished brass oval plaque is fixed with its two caps to the pale limestone wall inside an old village "
               "church porch, at head height. Beside it, softly out of focus, a tall pedestal arrangement of white lilies and "
               "greenery; the heavy oak church door stands ajar with daylight beyond. Soft daylight falls into the porch "
               "from the open doorway.",
         camera="at eye level, about 80 cm away, slightly to the right, so the oval is seen at a gentle angle. The plaque takes "
                "up about 40% of the frame width.",
         scale="The oval is 250 x 150 mm, about the width of a dinner plate and a half."),
    dict(id='polished-stainless-148x210-rect-plaque', overrides={},
         story="Harold Jenkins captained his bowls club and coached half the village. The members fixed his plaque on the "
               "pavilion wall facing the green.",
         lines=[('intro', 'In loving memory of'), ('name', 'HAROLD'), ('name', 'JENKINS'), ('date', '1930 – 2018'), ('gap', ''),
                ('body', 'Club captain, patient coach'), ('body', 'and always first to the bar.'),
                ('small', 'He bowled here for sixty years')],
         scene="The polished stainless plaque is fixed with its four caps to the white-painted timber boarding of a village "
               "bowls club pavilion, beside the open door, at head height. The bright mirror-polished steel reflects soft "
               "green from the lawn and white from the sky. The bowling green, its white edging and a green bench are softly "
               "blurred behind. Warm summer evening light.",
         camera="at eye level, about 70 cm away, slightly to the left, so the plaque is seen at a gentle angle. The plaque "
                "takes up about 35% of the frame width, portrait.",
         scale="A5 portrait plate, 148 x 210 mm; each white board is about 15 cm deep, so the plaque spans about one and a "
               "half boards across its height."),
    dict(id='polished-brass-297x210-rect-plaque', overrides={},
         story="Charlotte May Pemberton was headmistress of a village primary school for twenty-three years and planted its "
               "rose garden with her pupils. Her former pupils paid for the plaque on the garden wall.",
         lines=[('intro', 'In loving memory of'), ('name', 'CHARLOTTE MAY'), ('name', 'PEMBERTON'), ('date', '1931 – 2021'),
                ('gap', ''), ('body', 'Headmistress of this school'), ('body', 'from 1968 to 1991, who planted'),
                ('body', 'this rose garden with her pupils.'), ('small', 'Given with love by her former pupils')],
         scene="The polished brass plaque is fixed with its four caps to the red-brick wall of a small school rose garden, at "
               "about chest height. Roses in bloom and the end of a wooden bench are softly blurred in front and to the side. "
               "Soft summer morning light; the polished brass shows warm golden reflections.",
         camera="at eye level, about 1 m away, slightly to the right, gentle angle. The plaque takes up about 45% of the frame "
                "width.",
         scale="A4 plate (297 x 210 mm): about one and a half bricks long and three brick courses tall (bricks 215 x 65 mm)."),
    dict(id='aged-brass-148x210-rect-plaque', overrides={},
         story="Beatrice Holt started the Thursday lunch club in her village hall and ran it for thirty-one years. The club "
               "fixed her plaque in the hall's entrance.",
         lines=[('intro', 'In loving memory of'), ('name', 'BEATRICE'), ('name', 'ANNE HOLT'), ('date', '1922 – 2017'), ('gap', ''),
                ('body', 'She started our Thursday'), ('body', 'lunch club and ran it here'), ('small', 'for thirty-one years')],
         scene="The aged brass plaque is fixed with its four caps to the cream-painted brick wall of a village hall entrance, "
               "at head height, beside the hall's oak double doors with small glass panes. A row of wooden coat pegs and a "
               "folded trestle table are softly blurred in the background. Soft daylight from the open door.",
         camera="at eye level, about 70 cm away, slightly to the right, gentle angle. The plaque takes up about 35% of the "
                "frame width, portrait.",
         scale="A5 portrait plate, 148 x 210 mm: about two thirds of a brick wide and three brick courses tall."),
    dict(id='brushed-stainless-300x200-rect-plaque', overrides={},
         story="Alan Vaughan crewed his town's lifeboat for thirty-two years, the last ten as coxswain. His family and his "
               "crew put up the plaque on the lifeboat station wall, facing the harbour.",
         lines=[('intro', 'In loving memory of'), ('name', 'ALAN VAUGHAN'), ('date', '1944 – 2021'), ('gap', ''),
                ('body', 'Crew member and coxswain'), ('body', 'of this lifeboat station for 32 years'),
                ('small', 'Placed by his wife, his children and his crew')],
         scene="The brushed stainless plaque is fixed with its four caps to the white-rendered, salt-weathered wall of a small "
               "coastal lifeboat station, beside the big slipway doors, at head height. The harbour, moored boats and the "
               "sea are softly blurred behind. Bright, clean coastal daylight.",
         camera="at eye level, about 1 m away, slightly to the left, gentle angle. The plaque takes up about 40% of the frame "
                "width.",
         scale="The plate is 300 x 200 mm, a little smaller than a sheet of A3 paper."),
    dict(id='polished-brass-148x210-rect-light-wood-plaque', overrides={'border': True, 'borderStyle': 'scalloped'},
         story="Samuel Hargreaves rang the bells at St Mary's for seventy years. The ringers fixed his plaque in the tower's "
               "ringing chamber, where they still meet every Thursday.",
         lines=[('intro', 'In loving memory of'), ('name', 'SAMUEL'), ('name', 'HARGREAVES'), ('date', '1924 – 2011'), ('gap', ''),
                ('body', "Bell ringer at St Mary's"), ('body', 'for seventy years'), ('small', 'Ring on')],
         scene="The polished brass plaque on its light oak board is fixed to the whitewashed stone wall of a church tower's "
               "ringing chamber, at head height. Behind and beside it, softly out of focus, the bell ropes hang down with their "
               "red, white and blue striped woollen grips, looped up. Daylight comes in from a small arched window.",
         camera="at eye level, about 70 cm away, slightly to the left, gentle angle. The plaque takes up about 35% of the "
                "frame width, portrait.",
         scale="The oak board is 173 x 235 mm (portrait), the size of a hardback book."),
    dict(id='brushed-stainless-150x50-rect-plaque', overrides={},
         story="Joan Parry volunteered in her town's community garden for twenty years. Her friends there gave a bench in "
               "her name.",
         lines=[('intro', 'In loving memory of'), ('name', 'JOAN PARRY'), ('small', 'who loved this garden and all of us')],
         scene="The small brushed stainless bench plaque is screwed with its two screws to the middle of the top rail of the "
               "backrest of a weathered teak garden bench in a community garden. Raised vegetable beds, a greenhouse and "
               "sunflowers are softly blurred behind. Soft morning sunlight.",
         camera="close: about 50 cm from the bench back, at the height of the rail, slightly to one side. The plaque takes up "
                "about 35% of the frame width; the grain of the weathered teak is sharp around it.",
         scale="The plaque is only 150 x 50 mm, a little bigger than a mobile phone lying on its side; it fits on the top "
               "rail with teak showing above and below it."),
]

# ---------------------------------------------------------------- the 4 portrait cards ("A favourite face, beside their name")
# design='pim': Portraits in Metal's own artwork for each plaque (stencil from its proof render), unchanged.
PORTRAITS = [
    dict(id='portrait-george', stencil='stencils-v2/portrait-tree-george.png',
         story="George Hartley planted the trees round the edge of his allotment site forty years ago. The allotment "
               "society stood his portrait plaque under the oak he planted by the gate.",
         plate_desc="an A5 brushed brass plate on a light oak board, with an engraved portrait of George on the left and his "
                    "name and words on the right",
         scene="The plaque on its light oak board stands on ONE black square steel ground stake in the grass at the foot of "
               "a young oak by an allotment gate, autumn; golden oak leaves on the grass, sheds and runner-bean canes "
               "softly blurred behind. Soft low autumn sunshine."),
    dict(id='portrait-joan', stencil='stencils/portrait-tree-joan.png',
         story="Joan Whitfield's garden was full of hollyhocks and grandchildren. Her family fixed her portrait plaque on the "
               "garden wall above the bench where she sat every evening.",
         plate_desc="an A5 brushed stainless plate on a light oak board, with an engraved portrait of Joan on the left and "
                    "her name and a short poem on the right",
         scene="The plaque on its light oak board is fixed flat to an old garden wall of pale weathered brick, just above the "
               "back of a painted wooden garden bench; hollyhocks and climbing roses are softly blurred to the side. Soft "
               "evening light."),
    dict(id='portrait-bramble', stencil='stencils-v2/portrait-tree-bramble.png',
         story="Bramble, a springer spaniel, waited at the back gate every afternoon for the children to come home from "
               "school. His family stood his plaque on a stake beside that gate.",
         plate_desc="an A5 brushed brass plate on a light oak board, with an engraved portrait of Bramble the springer "
                    "spaniel on the left and his name and words on the right",
         scene="The plaque on its light oak board stands on ONE black square steel ground stake in the flower border beside a "
               "wooden back garden gate; a lawn and a well-chewed tennis ball are softly blurred nearby. Soft afternoon light."),
    dict(id='portrait-ron-pat', stencil='stencils-v2/portrait-tree-ron-pat.png',
         story="Ron and Pat Coleman were married for sixty-two years and shared a cup of tea under their apple tree every "
               "summer evening. Their children stood the plaque under that tree.",
         plate_desc="an A5 brushed stainless plate on a light oak board, with an engraved portrait of Ron and Pat cheek to "
                    "cheek on the left and their names and words on the right",
         scene="The plaque on its light oak board stands on ONE black square steel ground stake in the grass under an old, "
               "gnarled apple tree heavy with red apples; a few windfall apples lie in the grass. Two old garden chairs are "
               "softly blurred behind. Warm late-summer evening light."),
]
