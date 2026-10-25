import React from 'react';
import { ContactLink, WhatsAppIcon } from './ContactOptions';

// Memorial plaque wording guide (owner msg 5736: "Make all pages better so they climb Google
// more"). People search "what to write on a memorial plaque" more than almost anything else in
// the Ads search terms (23 Oct report); this page answers it, then offers to design it for them.
// Every name is invented.

type Example = { lines: string[]; size: string };
const library: Array<{ id: string; title: string; intro: string; examples: Example[] }> = [
  { id: 'mum-dad', title: 'For a mum or dad', intro: 'Use the name they were known by, and one line that sounds like them.', examples: [
    { size: 'A5', lines: ['In loving memory of', 'MARGARET ELLIS', '1942 – 2024', 'Mum, Nan, our everything'] },
    { size: 'A5', lines: ['DAVID “DAI” THOMAS', '1949 – 2023', 'A wonderful dad and grandad', 'who could fix anything'] },
    { size: 'A5', lines: ['Remembering', 'JEAN HOLLOWAY', '1938 – 2025', 'Her kitchen door was always open'] },
    { size: 'Bench', lines: ['For Dad', 'PETER SHAW', 'who loved this view'] },
  ] },
  { id: 'grandparents', title: 'For grandparents', intro: 'Grandchildren often choose the names they used: Nana, Grandad, Gramps.', examples: [
    { size: 'A5', lines: ['In memory of', 'NANA JOAN', '1935 – 2024', 'who made every day an adventure'] },
    { size: 'A5', lines: ['GRANDAD TED', '1938 – 2024', 'He taught us the name', 'of every tree in this garden'] },
    { size: 'A4', lines: ['In loving memory of', 'BILL & BETTY ROSS', 'married 62 years', 'Grandparents, great-grandparents', 'and the heart of our family'] },
  ] },
  { id: 'partner', title: 'For a husband, wife or partner', intro: 'Short and personal often reads best. Some families add the years they were together.', examples: [
    { size: 'A5', lines: ['DAVID ROWLANDS', '1948 – 2025', 'My husband, my best friend', 'Forever loved by Ann'] },
    { size: 'A5', lines: ['In loving memory of', 'SARAH KAUR', '1971 – 2023', 'Together for thirty years,', 'in my heart for ever'] },
    { size: 'Bench', lines: ['Sit awhile with', 'TOM & BETTY HARRIS', 'Together again'] },
  ] },
  { id: 'child', title: 'For a child or young person', intro: 'Many families choose a bright line, a nickname or something they loved.', examples: [
    { size: 'A5', lines: ['In memory of', 'LUCY MAY BENNETT', '2001 – 2024', 'Forever young, forever loved'] },
    { size: 'A5', lines: ['Our shining star', 'OLIVER JAMES', '2015 – 2022', 'Dream big, little one'] },
    { size: 'Oval', lines: ['For', 'ISLA', 'who loved the swings', 'Always our girl'] },
  ] },
  { id: 'friend', title: 'For a friend, colleague or club member', intro: 'Say what they gave to the people who knew them.', examples: [
    { size: 'Bench', lines: ['Donated in memory of', 'KEITH ANDREWS', 'a true friend of this park'] },
    { size: 'A5', lines: ['In memory of', 'STEVE NOLAN', '1961 – 2022', 'Captain, coach and friend'] },
    { size: 'A5', lines: ['Remembering', 'ROSE ATKINS', 'who made this allotment bloom', 'Planted by her friends, 2025'] },
  ] },
  { id: 'bench', title: 'For a memorial bench', intro: 'Bench plates are small: three or four short lines read best from a little distance.', examples: [
    { size: '150 × 50 mm', lines: ['In loving memory of', 'JOAN PARRY', 'who loved this garden and all of us'] },
    { size: '225 × 75 mm', lines: ['In loving memory of', 'LILY CHAMBERS', '1929 – 2019'] },
    { size: '200 × 50 mm', lines: ['In loving memory of', 'FRANK & IRIS DAVIES', 'Enjoy the view as they did'] },
    { size: '150 × 50 mm', lines: ['Remembering', 'BILL HUGHES', 'Rest here awhile'] },
  ] },
  { id: 'tree', title: 'For a memorial tree or garden', intro: 'Begin with the tree or place, then the person. Fix the plaque to a post beside the tree.', examples: [
    { size: 'A5', lines: ['This cherry tree was planted', 'in loving memory of', 'JIM PARTRIDGE', '1947 – 2025', 'Every spring, we will think of you'] },
    { size: 'A5', lines: ['This oak was planted', 'in memory of', 'MARGARET ELLIS', '1942 – 2024', 'who loved this green'] },
    { size: '200 × 150 mm', lines: ['Mum’s apple tree', 'In loving memory of', 'JOAN HARGREAVES', '1951 – 2024', 'Always in bloom'] },
    { size: 'A4', lines: ['This tree was planted by', 'the children of', 'ASHFIELD PRIMARY SCHOOL', 'in memory of Mrs Patricia Long', 'Teacher and friend, 1988 – 2023'] },
  ] },
  { id: 'ashes', title: 'Where ashes are scattered or interred', intro: 'A simple line can mark the place without saying too much.', examples: [
    { size: 'A5', lines: ['In loving memory of', 'IVY & SID MOORE', 'whose ashes rest here together', 'in the garden they loved'] },
    { size: 'A5', lines: ['CHARLOTTE MAY PEMBERTON', '1931 – 2021', 'Her ashes rest in this garden', 'Forever loved'] },
  ] },
  { id: 'pet', title: 'For a pet', intro: 'A name, the years and something they loved. A portrait from a photo can be engraved on A5 and larger.', examples: [
    { size: 'A5', lines: ['BRAMBLE', 'Our faithful friend', '2008 – 2022', 'Forever chasing rabbits'] },
    { size: 'Circle', lines: ['Here lies', 'WILLOW', 'The sweetest cat', '2005 – 2023'] },
    { size: 'A5', lines: ['This silver birch', 'is for', 'BISCUIT', 'our beautiful spaniel', '2011 – 2025'] },
  ] },
  { id: 'faith', title: 'Religious wording', intro: 'Churches may have their own guidance on wording; check before ordering.', examples: [
    { size: 'A5', lines: ['To the glory of God', 'and in memory of', 'EMILY CARTER', '1928 – 2016', 'who arranged the flowers here'] },
    { size: 'A5', lines: ['In loving memory of', 'FR MICHAEL BURKE', 'Parish priest 1986 – 2016', 'May he rest in peace'] },
    { size: 'A5', lines: ['WILLIAM ROWE', '1931 – 2024', 'The Lord is my shepherd'] },
  ] },
  { id: 'non-religious', title: 'Non-religious wording', intro: 'Celebrate a life, a place or a shared memory.', examples: [
    { size: 'A5', lines: ['Celebrating the life of', 'ROSEMARY ASHCROFT', '1938 – 2023', 'Gardener, artist and much-loved mum'] },
    { size: 'A5', lines: ['Remembering', 'ALAN VAUGHAN', '1944 – 2021', 'He made us laugh every single day'] },
    { size: 'Bench', lines: ['For', 'JOHN PENROSE', 'Gone sailing'] },
  ] },
];

const phrases = [
  'In loving memory of', 'Forever in our hearts', 'Always in our thoughts', 'Loved and remembered', 'Forever loved',
  'Until we meet again', 'Gone but never forgotten', 'Rest in peace', 'Sleep peacefully', 'Together again',
  'Enjoy the view as they did', 'Sit awhile and remember', 'Their name liveth for evermore', 'Your memory is our treasure',
  'Those we love walk beside us every day', 'A life well lived', 'Always with us', 'Forever chasing rabbits',
];

export function WordingLibrary() {
  return (
    <>
      <nav className="shop-section memorial-jump-links" aria-label="Wording examples by type">
        {library.map(group => <a key={group.id} href={`#wording-${group.id}`}>{group.title.replace(/^For an? /, '').replace(/^For /, '')}</a>)}
      </nav>
      <section className="shop-section shop-buying-guide">
        <div><p className="shop-kicker">How to write it</p><h2>Five lines are usually enough.</h2></div>
        <div>
          <article><h3>1. An opening line</h3><p>“In loving memory of”, “Remembering”, “This bench is in memory of” or “This tree was planted for”. It tells people what the plaque is for.</p></article>
          <article><h3>2. The name, largest</h3><p>Use the name people knew, including a nickname in quotation marks if it was what everyone called them. Capitals keep it clear from a distance.</p></article>
          <article><h3>3. Dates, if you want them</h3><p>Years are enough, such as 1942 – 2024. Full dates suit a church or a formal plaque. You can leave dates out entirely.</p></article>
          <article><h3>4. One line about them</h3><p>Something that sounds like them, a place they loved or how they’ll be remembered. A short, true line says more than a long verse.</p></article>
          <article><h3>5. Who it is from (optional)</h3><p>“With love from all the family”, “Placed by his friends at the club”. Keep it smaller than the name.</p></article>
        </div>
      </section>
      {library.map(group => (
        <section className="shop-section shop-wording-examples" id={`wording-${group.id}`} key={group.id} aria-labelledby={`wording-${group.id}-heading`}>
          <p className="shop-kicker">Memorial wording ideas</p>
          <h2 id={`wording-${group.id}-heading`}>{group.title}.</h2>
          <p>{group.intro}</p>
          <div className="shop-inscription-grid">
            {group.examples.map((example, index) => (
              <article key={index}>
                <h3>{example.size}</h3>
                <blockquote>{example.lines.map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</blockquote>
              </article>
            ))}
          </div>
        </section>
      ))}
      <section className="shop-section shop-wording-examples" aria-labelledby="wording-phrases-heading">
        <p className="shop-kicker">Short phrases</p>
        <h2 id="wording-phrases-heading">Short memorial phrases.</h2>
        <p>Use one as the last line, or on its own beneath the name on a small bench plaque.</p>
        <ul className="shop-phrase-list">{phrases.map(phrase => <li key={phrase}>{phrase}</li>)}</ul>
        <p>
          Stuck for words? <ContactLink channel="whatsapp" placement="page" subject="memorial plaque wording"><WhatsAppIcon /> Send us what you have on WhatsApp</ContactLink> and
          we’ll suggest a layout and send you a free proof, usually within 3 working hours.
        </p>
      </section>
    </>
  );
}
