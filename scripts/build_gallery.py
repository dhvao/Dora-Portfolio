"""Generate static collection, series, and artwork pages from the curated catalog."""
import json, html, posixpath
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'docs'
C = json.loads((ROOT / 'content/curation.json').read_text(encoding='utf-8'))
inventory = {i['id']: i for i in json.loads((ROOT / 'content/source-inventory.json').read_text(encoding='utf-8'))}
collections = {c['id']: c for c in C['collections']}
series = {s['id']: s for s in C['series']}
artist = C['artist']
current = 'index.html'
e = html.escape

def url(path):
    return posixpath.relpath(path, posixpath.dirname(current) or '.')

def image(n, large=False, eager=False, extra=''):
    item = inventory[n]
    thumb = url(f'assets/art/{n:03}-thumb.webp')
    full = url(f'assets/art/{n:03}-large.webp')
    from PIL import Image
    with Image.open(DIST / f'assets/art/{n:03}-thumb.webp') as im: tw = im.width
    with Image.open(DIST / f'assets/art/{n:03}-large.webp') as im: fw = im.width
    return f'<img src="{full if large else thumb}" srcset="{thumb} {tw}w, {full} {fw}w" sizes="{extra or "(max-width: 600px) 88vw, (max-width: 900px) 42vw, 30vw"}" width="{item["width"]}" height="{item["height"]}" alt="{e(C["descriptions"][str(n)])}" loading="{"eager" if eager else "lazy"}" decoding="async" {"fetchpriority=high" if eager else ""}>'

def link(path, text, cls='text-link'):
    return f'<a class="{cls}" href="{url(path)}">{text}<span aria-hidden="true">↗</span></a>'

def series_path(s): return f'collections/{s["collection"]}/{s["id"]}/index.html'
def work_path(n): return f'works/{n:03}/index.html'

def count(c): return sum(len(series[s]['works']) for s in c['series'])

def crumbs(parts):
    return '<nav class="breadcrumbs" aria-label="Breadcrumb">' + ' <span aria-hidden="true">/</span> '.join(f'<a href="{url(path)}">{e(label)}</a>' if path else f'<span aria-current="page">{e(label)}</span>' for label,path in parts) + '</nav>'

def wordmark(word): return f'<h1 id="wordmark" aria-label="{word}">{word}</h1>'

def work_card(n, label=None):
    variants = len(C['variants'].get(str(n), []))
    return f'<a class="work-card" href="{url(work_path(n))}"><div class="work-image">{image(n)}<span class="view-mark" aria-hidden="true">↗</span></div><div class="work-caption"><span>{e(label or C["descriptions"][str(n)])}</span><span class="work-code">{n:03}{" +" if variants else ""}</span></div></a>'

def rail():
    return '''<aside id="ruler" aria-label="Page navigation"><div class="rail-frost"></div><div class="top-pool"></div><div class="bottom-pool"></div><div id="ticks" aria-hidden="true"></div><div id="viewport-bracket" aria-hidden="true"></div><div id="needle" aria-hidden="true"><span>000%</span></div><div id="ghost" aria-hidden="true"><span></span></div><div id="rail-input" role="slider" tabindex="0" aria-label="Page scroll position. Hover for the page map, drag or use arrow keys to navigate." aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-orientation="vertical"></div><nav id="section-labels" aria-label="Animated section navigation"></nav><div class="rail-hint" aria-hidden="true">Drag to explore</div></aside>'''

def save(path, title, body, nav, kind=''):
    # All paths in body are generated with current already pointing to this page.
    dest = DIST / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    menu = ''.join(f'<a class="nav-link" href="#{anchor}">{e(label)}</a>' for anchor,label in nav)
    document = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} — {e(artist)}</title><meta name="description" content="Explore {e(title.lower())} from the visual archive of {e(artist)}."><link rel="stylesheet" href="{url('style.css')}"><link rel="stylesheet" href="{url('ruler.css')}"><script src="{url('site-config.js')}" defer></script><script src="{url('app.js')}" defer></script><script src="{url('gallery.js')}" defer></script></head>
<body class="{kind}"><div id="art-background" aria-hidden="true"></div><a class="skip" href="#main">Skip to content</a><header class="header"><a class="brand" href="{url('index.html')}">{e(artist)}<span class="brand-star" aria-hidden="true">✳</span></a><nav aria-label="On this page">{menu}</nav><a class="archive-link" href="{url('archive/index.html')}">All works <span>↗</span></a><button class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open navigation">Menu +</button></header><nav id="mobile-menu" hidden aria-label="Collections"><a href="{url('index.html')}">Home</a>{''.join(f'<a href="{url("collections/"+c["id"]+"/index.html")}">{e(c["title"])}</a>' for c in C['collections'])}<a href="{url('archive/index.html')}">All works</a></nav><main id="main">{body}<footer><div class="footer-top"><a class="footer-name" href="{url('index.html')}">{e(artist)}<span>↗</span></a><div><p class="eyebrow">Continue exploring</p>{''.join(f'<a href="{url("collections/"+c["id"]+"/index.html")}">{e(c["title"])}</a>' for c in C['collections'])}</div></div><div class="footer-bottom"><span>Painting · Drawing · Digital</span><a href="{url('references/index.html')}">Reference shelf</a><a href="#intro">Back to top ↑</a></div></footer></main>{rail()}<dialog id="image-viewer" aria-label="Enlarged artwork"><button class="viewer-close" aria-label="Close enlarged artwork">Close ×</button><img alt=""><p></p></dialog></body></html>'''
    dest.write_text(document, encoding='utf-8')

# Home: a small edit, followed by three collection entrances.
current = 'index.html'
body = f'''<section id="intro" class="home-hero" data-label="WORKS"><div class="hero-copy"><p class="eyebrow">{e(artist)} / Selected archive</p>{wordmark('WORKS')}<p class="hero-statement">Bodies, places<br>&amp; <em>traces.</em></p><p class="hero-description">A collection of paintings, drawings and digital explorations. Follow a line. Find a series. Take a closer look.</p><a href="#digital" class="round-link"><span>Explore the collections</span><b aria-hidden="true">↓</b></a></div><figure class="hero-art"><a href="{url(work_path(34))}">{image(34,True,True,'(max-width: 700px) 80vw, 42vw')}</a><figcaption><span>Colour &amp; body</span><a href="{url(series_path(series['colour-and-body']))}">Digital works ↗</a></figcaption></figure><div class="hero-baseline"><span>Scroll to discover ↓</span></div></section>'''
for c in C['collections']:
    secondary = {'digital':76,'red':7,'studio':19}[c['id']]
    body += f'''<section id="{c['id']}" class="collection-feature" data-label="{c['rail']}" style="--collection-tone:{c['accent']}"><div class="section-bar"><span>{c['number']} / Collection</span><span>{len(c['series'])} series · {count(c)} works</span></div><div class="feature-layout"><div class="feature-copy"><h2>{e(c['title'])}<span>.</span></h2><p>{e(c['description'])}</p>{link('collections/'+c['id']+'/index.html','Enter collection','pill-link')}<div class="series-list">{''.join(link(series_path(series[s]),e(series[s]['title'])) for s in c['series'])}</div></div><a class="feature-main" href="{url('collections/'+c['id']+'/index.html')}">{image(c['cover'],True)}</a><figure class="feature-secondary">{image(secondary)}<figcaption>{e(C['descriptions'][str(secondary)])}</figcaption></figure></div></section>'''
save(current,'Selected works',body,[('intro','Index'),('digital','Digital'),('red','Red studies'),('studio','Studio')],'home')

# Collection entrances: each series is a destination, not a wall of every image.
for c in C['collections']:
    current = f'collections/{c["id"]}/index.html'
    body = f'''<section id="intro" class="collection-hero" data-label="{c['rail']}">{crumbs([('Home','index.html'),(c['title'],None)])}<div class="collection-hero-grid"><div><p class="eyebrow">Collection {c['number']} / {count(c)} works</p>{wordmark(c['rail'])}<h2>{e(c['title'])}</h2><p class="intro-copy">{e(c['description'])}</p><a href="#{c['series'][0]}" class="text-link">Explore {len(c['series'])} series <span>↓</span></a></div><figure>{image(c['cover'],True,True)}<figcaption>{e(series[c['series'][0]]['title'])}</figcaption></figure></div></section>'''
    for idx,sid in enumerate(c['series']):
        s=series[sid]
        body += f'''<section class="series-entry" id="{sid}" data-label="{s['rail']}"><div class="section-bar"><span>{idx+1:02} / Series</span><span>{len(s['works'])} works</span></div><div class="series-entry-top"><h2>{e(s['title'])}</h2><div><p>{e(s['description'])}</p>{link(series_path(s),'View the series','pill-link')}</div></div><div class="series-preview">{''.join(work_card(n) for n in s['works'][:3])}</div></section>'''
    save(current,c['title'],body,[('intro',c['title'])]+[(sid,series[sid]['title']) for sid in c['series']],'collection-page')

# Series pages: naturally proportioned artwork, then individual work pages.
for s in C['series']:
    c=collections[s['collection']]
    current=series_path(s)
    body=f'''<section id="intro" class="series-heading" data-label="{s['rail']}">{crumbs([('Home','index.html'),(c['title'],f'collections/{c["id"]}/index.html'),(s['title'],None)])}<p class="eyebrow">{e(c['title'])} / {len(s['works'])} works</p>{wordmark(s['rail'])}<div class="series-heading-bottom"><h2>{e(s['title'])}</h2><p>{e(s['description'])}</p></div></section><section id="gallery" class="gallery-section" data-label="GALLERY"><div class="section-bar"><span>The complete series</span><span>{len(s['works']):02} works / Click to view</span></div><div class="art-grid">{''.join(work_card(n) for n in s['works'])}</div></section><section id="explore" class="continue-section" data-label="EXPLORE"><p class="eyebrow">Keep looking</p><h2>Another point<br>of <em>view.</em></h2>{link(f'collections/{c["id"]}/index.html','Back to '+e(c['title']),'pill-link')}</section>'''
    save(current,s['title'],body,[('intro','The series'),('gallery','Gallery'),('explore','Explore')],'series-page')
    for idx,n in enumerate(s['works']):
        current=work_path(n)
        title=C['descriptions'][str(n)]
        variants=C['variants'].get(str(n),[])
        medium='Procreate / digital work' if c['id']=='digital' else 'Studio archive'
        body=f'''<section id="intro" class="work-heading" data-label="WORK">{crumbs([('Home','index.html'),(c['title'],f'collections/{c["id"]}/index.html'),(s['title'],series_path(s)),(f'{n:03}',None)])}<div class="work-title-row">{wordmark('WORK')}<div><p class="eyebrow">{e(s['title'])} / {n:03}</p><h2>{e(title)}</h2></div></div></section><section id="artwork" class="artwork-section" data-label="ARTWORK"><figure class="artwork-full"><button class="zoom-art" data-zoom="{url(f'assets/art/{n:03}-large.webp')}" data-caption="{e(title)}" aria-label="Enlarge {e(title)}">{image(n,True,True,'(max-width: 700px) 90vw, 75vw')}<span>View larger ↗</span></button><figcaption><span>{e(title)}</span><span>{medium}</span></figcaption></figure></section>'''
        nav=[('intro','The work'),('artwork','Artwork')]
        if variants:
            body+=f'<section id="versions" class="versions-section" data-label="VERSIONS"><div class="section-bar"><span>From the same work</span><span>Alternate export</span></div><div class="version-grid">'
            for v in variants:
                body+=f'<figure><button class="zoom-art" data-zoom="{url(f"assets/art/{v:03}-large.webp")}" data-caption="{e(C["descriptions"][str(v)])}" aria-label="Enlarge alternate export">{image(v)}<span>View larger ↗</span></button><figcaption>Alternate export / {v:03}</figcaption></figure>'
            body+='</div></section>';nav.append(('versions','Versions'))
        prev=s['works'][(idx-1)%len(s['works'])];nxt=s['works'][(idx+1)%len(s['works'])]
        body+=f'<section id="explore" class="work-next" data-label="EXPLORE"><div class="section-bar"><span>{idx+1:02} / {len(s["works"]):02} in this series</span>{link(series_path(s),"View full series")}</div><div class="next-grid"><div><p class="eyebrow">← Previous work</p>{work_card(prev)}</div><div><p class="eyebrow">Next work →</p>{work_card(nxt)}</div></div></section>'
        nav.append(('explore','More works'))
        save(current,title,body,nav,'work-page')

current='archive/index.html'
body=f'<section id="intro" class="series-heading" data-label="ARCHIVE">{crumbs([("Home","index.html"),("All works",None)])}<p class="eyebrow">The full collection / 71 works</p>{wordmark("ARCHIVE")}<div class="series-heading-bottom"><h2>Everything,<br><em>in its place.</em></h2><p>Browse by collection, or search the archive by subject. Alternate exports live alongside their original work.</p></div></section><section id="browse" class="gallery-section" data-label="BROWSE"><div class="archive-controls"><div class="filter-buttons" role="group" aria-label="Filter collection"><button data-filter="all" aria-pressed="true">All <sup>71</sup></button>'+''.join(f'<button data-filter="{c["id"]}" aria-pressed="false">{e(c["title"])} <sup>{count(c)}</sup></button>' for c in C['collections'])+'</div><label class="search-field"><span>Search works</span><input id="archive-search" type="search" placeholder="A figure, a street, a colour…"></label></div><p id="results-count" aria-live="polite">71 works</p><div class="art-grid archive-grid">'
for s in C['series']:
    for n in s['works']:
        body+=f'<div class="archive-item" data-collection="{s["collection"]}" data-search="{e((C["descriptions"][str(n)]+" "+s["title"]+" "+collections[s["collection"]]["title"]).lower())}">{work_card(n)}</div>'
body+='</div><p id="empty-results" hidden>No works match this search. Try another word or collection.</p></section>'
save(current,'All works',body,[('intro','Archive'),('browse','Browse')],'archive-page')

current='references/index.html'
body=f'<section id="intro" class="series-heading" data-label="REFERENCES">{crumbs([("Home","index.html"),("Reference shelf",None)])}<p class="eyebrow">Visual research / 3 images</p>{wordmark("REFERENCES")}<div class="series-heading-bottom"><h2>The reference<br><em>shelf.</em></h2><p>Architectural images found among the source material, kept separately as visual references. Authorship and source credits have not yet been confirmed.</p></div></section><section id="images" class="gallery-section" data-label="IMAGES"><div class="art-grid">'
for n in C['references']:
    body+=f'<figure class="reference-card"><button class="zoom-art" data-zoom="{url(f"assets/art/{n:03}-large.webp")}" data-caption="{e(C["descriptions"][str(n)])}" aria-label="Enlarge reference {n}">{image(n)}<span>View larger ↗</span></button><figcaption>{e(C["descriptions"][str(n)])}<small>Visual reference · creator unconfirmed</small></figcaption></figure>'
body+='</div></section>'
save(current,'Reference shelf',body,[('intro','References'),('images','Images')],'references-page')

used=[n for s in C['series'] for n in s['works']]+[n for vs in C['variants'].values() for n in vs]+C['references']
assert len(used)==78 and len(set(used))==78 and set(used)==set(inventory), 'Every supplied image must have exactly one catalog role.'
print(f'Built {len(list(DIST.rglob("*.html")))} pages: 71 artworks, 8 series, 3 collections, home, archive, references.')
