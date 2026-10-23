"""
Builds the English side of the site from the bilingual markup.

Run once, the day the two languages were separated. Each page went in with
both languages inside it and came out twice: the Spanish one in its place,
with nothing English left in it, and the English one under /en/.

What the English page needs beyond the split: its own address in the
canonical and in the sharing cards, its own head strings - which are the
ones the site had before it was translated, recovered from the commit that
translated it - its own hreflang pair, and asset paths measured from the
root, since /en/nuvra is a folder deeper than the page it was copied from.
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from split_languages import split

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://www.chavescerrejon.com'
PAGES = sorted(f for f in os.listdir(ROOT) if f.endswith('.html') and f != '404.html')


def slug_of(name):
    return '' if name == 'index.html' else name[:-5]


def address(slug, lang):
    if lang == 'es':
        return SITE + '/' + slug
    return SITE + '/en' + ('/' + slug if slug else '')


def alternates(slug):
    """Each page points at itself and at its twin, and says which one answers
       when the asking language is neither."""
    return (
        '<link rel="alternate" hreflang="es" href="%s">\n'
        '<link rel="alternate" hreflang="en" href="%s">\n'
        '<link rel="alternate" hreflang="x-default" href="%s">\n'
    ) % (address(slug, 'es'), address(slug, 'en'), address(slug, 'es'))


def put_alternates(s, slug):
    s = re.sub(r'\n?<link rel="alternate" hreflang="[^"]*" href="[^"]*">', '', s)
    return s.replace('<link rel="canonical"', alternates(slug) + '<link rel="canonical"', 1)


def head_of(path):
    """The English strings as the site had them before it spoke Spanish."""
    s = open(path, encoding='utf-8').read()
    grab = lambda p: (re.search(p, s) or [None, None])[1]
    return {
        'title': grab(r'<title>(.*?)</title>'),
        'description': grab(r'<meta name="description" content="([^"]*)"'),
        'og:title': grab(r'<meta property="og:title" content="([^"]*)"'),
        'og:description': grab(r'<meta property="og:description" content="([^"]*)"'),
        'twitter:title': grab(r'<meta name="twitter:title" content="([^"]*)"'),
        'twitter:description': grab(r'<meta name="twitter:description" content="([^"]*)"'),
        'jsonld': (re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S) or [None, None])[1],
    }


def english_head(s, old, slug):
    if old['title']:
        s = re.sub(r'<title>.*?</title>', '<title>%s</title>' % old['title'], s, count=1)
    for name, prop in (('description', 'name'), ('twitter:title', 'name'), ('twitter:description', 'name'),
                       ('og:title', 'property'), ('og:description', 'property')):
        if old.get(name):
            s = re.sub(r'<meta %s="%s" content="[^"]*">' % (prop, re.escape(name)),
                       '<meta %s="%s" content="%s">' % (prop, name, old[name]), s, count=1)
    if old['jsonld']:
        blob = old['jsonld'].replace(SITE + '/' + (slug + '.html' if slug else ''), address(slug, 'en'))
        s = re.sub(r'<script type="application/ld\+json">.*?</script>',
                   lambda m: '<script type="application/ld+json">%s</script>' % blob, s, count=1, flags=re.S)
    # its own address, and the pair of languages the other way round
    s = s.replace('<link rel="canonical" href="%s">' % address(slug, 'es'),
                  '<link rel="canonical" href="%s">' % address(slug, 'en'))
    s = s.replace('<meta property="og:url" content="%s">' % address(slug, 'es'),
                  '<meta property="og:url" content="%s">' % address(slug, 'en'))
    s = s.replace('<meta property="og:locale" content="es_ES">', '<meta property="og:locale" content="en_GB">')
    s = s.replace('<meta property="og:locale:alternate" content="en_GB">',
                  '<meta property="og:locale:alternate" content="es_ES">')
    return s


def english_paths(s):
    """A page under /en/ is a folder deeper, so everything it asks for is asked
       for from the root; and every page of the site it links to is the English
       one."""
    s = re.sub(r'(href|src|poster|data-src)="assets/', lambda m: '%s="/assets/' % m.group(1), s)
    s = re.sub(r'url\(\'\.\./', "url('../", s)
    s = s.replace('href="/"', 'href="/en"')
    for page in PAGES:
        slug = slug_of(page)
        if slug:
            s = s.replace('href="/%s"' % slug, 'href="/en/%s"' % slug)
            s = s.replace('href="/%s#' % slug, 'href="/en/%s#' % slug)
    return s


def language_switch(s, slug, lang):
    """The selector stops being a switch and becomes what it always was in
       truth: the way to the same page in the other language."""
    old = re.search(r'<div class="seg" data-seg="lang".*?</div>', s, re.S)
    if not old:
        return s
    here = '0' if lang == 'es' else '1'
    new = (
        '<div class="seg" data-seg="lang" data-i="%s" role="group" aria-label="Idioma / Language">\n'
        '          <span class="seg__thumb" aria-hidden="true"></span>\n'
        '          <a class="seg__opt" href="%s" hreflang="es" lang="es"%s>ES</a>\n'
        '          <a class="seg__opt" href="%s" hreflang="en" lang="en"%s>EN</a>\n'
        '        </div>'
    ) % (here,
         '/' + slug, ' aria-current="true"' if lang == 'es' else '',
         '/en' + ('/' + slug if slug else ''), ' aria-current="true"' if lang == 'en' else '')
    return s[:old.start()] + new + s[old.end():]


def bootstrap(s):
    """The page says which language it is; only the light is remembered."""
    return re.sub(
        r"<script>\(function\(\)\{try\{var r=document\.documentElement.*?\}\)\(\);</script>",
        "<script>(function(){try{var t=localStorage.getItem('vc-theme');"
        "if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>",
        s, count=1, flags=re.S)


def main():
    old_tree = sys.argv[1]
    os.makedirs(os.path.join(ROOT, 'en'), exist_ok=True)
    for page in PAGES:
        slug = slug_of(page)
        source = open(os.path.join(ROOT, page), encoding='utf-8').read()

        spanish = split(source, 'es')
        spanish = put_alternates(spanish, slug)
        spanish = language_switch(spanish, slug, 'es')
        spanish = bootstrap(spanish)
        # The document's own language is the one attribute that is not a
        # repetition: the split takes lang="es" off everything it unwraps, and
        # the page needs it back where it means something.
        spanish = spanish.replace('<html data-lang="es"', '<html lang="es" data-lang="es"', 1)
        open(os.path.join(ROOT, page), 'w', encoding='utf-8').write(spanish)

        english = split(source, 'en')
        english = english_head(english, head_of(os.path.join(old_tree, page)), slug)
        english = put_alternates(english, slug)
        english = bootstrap(english)
        english = english.replace('<html lang="es" data-lang="es"', '<html lang="en" data-lang="en"', 1)
        english = english_paths(english)
        # Last of all: the selector is the one pair of links in the page that
        # does not point at this side of the site.
        english = language_switch(english, slug, 'en')
        open(os.path.join(ROOT, 'en', page), 'w', encoding='utf-8').write(english)
        print('%-16s -> %s + en/%s' % (page, page, page))


if __name__ == '__main__':
    main()
