"""Validate catalog coverage and every local HTML link, image, and fragment."""
import json
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
class Document(HTMLParser):
    def __init__(self, path):
        super().__init__();self.ids=set();self.refs=[];self.images=0
        self.feed(path.read_text(encoding='utf-8'))
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a:
            assert a['id'] not in self.ids, f'Duplicate ID: {a["id"]}'
            self.ids.add(a['id'])
        for key in ['href','src','data-zoom']:
            if a.get(key):self.refs.append(a[key])
        if a.get('srcset'):
            self.refs.extend(part.strip().split()[0] for part in a['srcset'].split(','))
        if tag=='img':
            assert 'alt' in a,'Image missing alt attribute'
            self.images+=1

docs={p.resolve():Document(p) for p in DIST.rglob('*.html')}
errors=[]
for path,doc in docs.items():
    for ref in doc.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        target=(path.parent/unquote(u.path)).resolve() if u.path else path
        if target.is_dir():target=target/'index.html'
        if not target.is_file():errors.append(f'{path.relative_to(DIST)} -> missing {ref}')
        elif u.fragment and target in docs and unquote(u.fragment) not in docs[target].ids:
            errors.append(f'{path.relative_to(DIST)} -> missing anchor {ref}')
c=json.loads((ROOT/'content/curation.json').read_text(encoding='utf8'))
ids=[n for s in c['series'] for n in s['works']]+[n for vs in c['variants'].values() for n in vs]+c['references']
assert len(ids)==len(set(ids))==78
assert len(docs)==85
assert not errors,'\n'.join(errors)
print(f'PASS: {len(docs)} pages; all internal links/assets/fragments resolve; all 78 images accounted for once.')
