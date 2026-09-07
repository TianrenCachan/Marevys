"""Read markup from stdin for structural and text inventory checks; no browser is used."""
from html.parser import HTMLParser
import json
import sys

class Inventory(HTMLParser):
    void = set('area base br col embed hr img input link meta param source track wbr'.split())
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids = []
        self.text = []
        self.attributes = []
        self.images = []
        self.handlers = []
        self.errors = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        for key in ('placeholder', 'alt', 'aria-label'):
            if attrs.get(key): self.attributes.append(attrs[key])
        if attrs.get('data-image'): self.images.append(attrs['data-image'])
        if attrs.get('onclick'): self.handlers.append(attrs['onclick'])
        if tag not in self.void: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.void: return
        if not self.stack or self.stack[-1] != tag:
            self.errors.append({'closing': tag, 'open': self.stack[-3:]})
        if tag in self.stack:
            while self.stack and self.stack.pop() != tag: pass
    def handle_data(self, data):
        if not set(self.stack).intersection({'style', 'script', 'select'}) and data.strip():
            self.text.append(' '.join(data.split()))

p = Inventory()
p.feed(sys.stdin.read())
print(json.dumps({'ids':p.ids,'text':p.text,'attributes':p.attributes,'images':p.images,'handlers':p.handlers,'errors':p.errors,'unclosed':p.stack},ensure_ascii=False))
