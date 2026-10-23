"""
Cuts the bilingual markup in two.

Until now every page carried its two languages at once: the Spanish written
out and the English waiting beside it, either as a twin block marked
data-only or as a pair of attributes on a single run of text. One page, one
address, two languages - which reads well in a browser and badly in a search
engine, where there was no English address at all.

This takes one of those pages and returns it in a single language: the twin
that belongs to the other one is removed, the one that stays is unwrapped,
every data-t run is said once and for all, and the paired attributes lose
their suffix. Nothing else in the file is touched - the surgery is done on
the text of the document, not by parsing and printing it again, so what is
not addressed here comes out byte for byte as it went in.
"""

import re

VOID = {'br', 'img', 'hr', 'meta', 'source', 'input', 'link', 'path', 'circle', 'line', 'use'}


def element_end(s, start):
    """Given the index of a '<' that opens an element, the index just past its
       closing tag. Counts its own kind on the way so nesting is safe."""
    name = re.match(r'<([a-zA-Z0-9]+)', s[start:]).group(1)
    if name.lower() in VOID:
        return s.index('>', start) + 1
    depth = 0
    i = start
    opener = re.compile(r'<%s[\s>/]' % re.escape(name), re.I)
    closer = '</%s>' % name
    while i < len(s):
        nxt_open = opener.search(s, i)
        nxt_close = s.find(closer, i)
        if nxt_close == -1:
            raise ValueError('unclosed <%s> at %d' % (name, start))
        if nxt_open and nxt_open.start() < nxt_close:
            depth += 1
            i = nxt_open.end()
            continue
        depth -= 1
        i = nxt_close + len(closer)
        if depth == 0:
            return i
    raise ValueError('unclosed <%s> at %d' % (name, start))


def drop_other(s, keep):
    """Remove every element written for the other language."""
    other = 'en' if keep == 'es' else 'es'
    while True:
        m = re.search(r'<[a-zA-Z0-9]+[^>]*\bdata-only="%s"' % other, s)
        if not m:
            return s
        end = element_end(s, m.start())
        # the whitespace that was holding it up goes with it
        head = s[:m.start()].rstrip(' ')
        tail = s[end:]
        if head.endswith('\n') and tail.startswith('\n'):
            tail = tail[1:]
        s = head + tail


def unwrap_kept(s, keep):
    """The twin that stays loses the marks that made it a twin."""
    s = re.sub(r'\s*data-only="%s"' % keep, '', s)
    # lang="es" on a Spanish page (or en on an English one) says nothing the
    # document has not said already. The space in front is part of the match:
    # without it this would eat its way into data-lang and hreflang.
    s = re.sub(r'\slang="%s"(?=[\s>])' % keep, '', s)
    return s


def say_runs(s, keep):
    """Every data-t run is said once, in the language of the page."""
    out = []
    i = 0
    for m in re.finditer(r'<([a-zA-Z0-9]+)([^>]*\bdata-t\b[^>]*)>', s):
        if m.start() < i:
            continue
        name, attrs = m.group(1), m.group(2)
        said = re.search(r'\bdata-%s="([^"]*)"' % keep, attrs)
        if not said:
            continue
        clean = re.sub(r'\s*\bdata-t\b', '', attrs)
        clean = re.sub(r'\s*\bdata-(es|en)="[^"]*"', '', clean)
        end = element_end(s, m.start())
        out.append(s[i:m.start()])
        out.append('<%s%s>%s</%s>' % (name, clean, said.group(1), name))
        i = end
    out.append(s[i:])
    return ''.join(out)


def paired_attributes(s, keep):
    """data-x carries the English and data-x-es the Spanish; the page keeps one
       of them under the plain name."""
    pairs = set(re.findall(r'\bdata-([a-z-]+)-es="', s))
    for base in pairs:
        if keep == 'es':
            s = re.sub(
                r'\bdata-%s="[^"]*"((?:(?!>)[^<])*?)\s*data-%s-es="([^"]*)"' % (base, base),
                lambda m: 'data-%s="%s"%s' % (base, m.group(2), m.group(1)),
                s)
        s = re.sub(r'\s*\bdata-%s-es="[^"]*"' % base, '', s)
    return s


def split(source, keep):
    s = drop_other(source, keep)
    s = unwrap_kept(s, keep)
    s = say_runs(s, keep)
    s = paired_attributes(s, keep)
    return s
