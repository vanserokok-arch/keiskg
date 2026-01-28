import sys
from pathlib import Path

css_path = Path('styles.css')
out_path = Path('styles.fixed.css')
text = css_path.read_text(encoding='utf-8')

class TextNode:
    def __init__(self, text):
        self.text = text
    def render(self):
        return self.text

class BlockNode:
    def __init__(self, prelude):
        self.prelude = prelude
        self.children = []
    def render(self):
        inner = ''.join([c.render() for c in self.children])
        return f"{self.prelude}{{{inner}}}"

class MediaNode:
    def __init__(self, prelude):
        self.prelude = prelude.strip()
        self.children = []
    def render(self):
        inner = ''.join([c.render() for c in self.children])
        return f"{self.prelude}{{{inner}}}"

class RootNode:
    def __init__(self):
        self.children = []
    def render(self):
        return ''.join([c.render() for c in self.children])

# parser
root = RootNode()
stack = [root]
buf = []
i = 0
n = len(text)

def flush_buf_to_parent():
    if not buf:
        return
    s = ''.join(buf)
    stack[-1].children.append(TextNode(s))
    buf.clear()

while i < n:
    ch = text[i]
    # comments
    if text.startswith('/*', i):
        end = text.find('*/', i+2)
        if end == -1:
            # unterminated comment, take rest
            buf.append(text[i:])
            break
        buf.append(text[i:end+2])
        i = end+2
        continue
    # strings
    if ch == '"' or ch == "'":
        quote = ch
        j = i+1
        esc = False
        while j < n:
            if text[j] == '\\' and not esc:
                esc = True
                j += 1
                continue
            if text[j] == quote and not esc:
                j += 1
                break
            esc = False
            j += 1
        buf.append(text[i:j])
        i = j
        continue
    # @media
    if text.startswith('@media', i):
        # flush buffer to parent
        flush_buf_to_parent()
        # read until next '{'
        brace = text.find('{', i)
        if brace == -1:
            # malformed, append rest and break
            buf.append(text[i:])
            break
        pre = text[i:brace]
        node = MediaNode(pre)
        stack[-1].children.append(node)
        stack.append(node)
        i = brace+1
        continue
    if ch == '{':
        # start generic block; capture prelude from buffer
        pre = ''.join(buf)
        buf.clear()
        node = BlockNode(pre)
        stack[-1].children.append(node)
        stack.append(node)
        i += 1
        continue
    if ch == '}':
        # flush buffer into current node
        if buf:
            stack[-1].children.append(TextNode(''.join(buf)))
            buf.clear()
        # pop
        if len(stack) > 1:
            stack.pop()
        else:
            # stray closing brace, keep
            stack[-1].children.append(TextNode('}'))
        i += 1
        continue
    # default
    buf.append(ch)
    i += 1

# flush remaining
if buf:
    stack[-1].children.append(TextNode(''.join(buf)))
    buf.clear()

# Now flatten nested media

def flatten_block(block):
    out = []
    acc = []
    for child in block.children:
        if isinstance(child, MediaNode):
            if acc:
                b = BlockNode(block.prelude)
                b.children = acc
                out.append(b)
                acc = []
            out.extend(flatten_media(child))
        elif isinstance(child, BlockNode):
            sub = flatten_block(child)
            for item in sub:
                if isinstance(item, MediaNode):
                    if acc:
                        b = BlockNode(block.prelude)
                        b.children = acc
                        out.append(b)
                        acc = []
                    out.extend(flatten_media(item))
                else:
                    acc.append(item)
        else:
            acc.append(child)
    if acc:
        b = BlockNode(block.prelude)
        b.children = acc
        out.append(b)
    return out


def flatten_media(media):
    out = []
    acc = []
    for child in media.children:
        if isinstance(child, MediaNode):
            if acc:
                m = MediaNode(media.prelude)
                m.children = acc
                out.append(m)
                acc = []
            out.extend(flatten_media(child))
        elif isinstance(child, BlockNode):
            sub = flatten_block(child)
            for item in sub:
                if isinstance(item, MediaNode):
                    if acc:
                        m = MediaNode(media.prelude)
                        m.children = acc
                        out.append(m)
                        acc = []
                    out.extend(flatten_media(item))
                else:
                    acc.append(item)
        else:
            acc.append(child)
    if acc:
        m = MediaNode(media.prelude)
        m.children = acc
        out.append(m)
    return out


def flatten_root(root):
    out = []
    for child in root.children:
        if isinstance(child, MediaNode):
            out.extend(flatten_media(child))
        elif isinstance(child, BlockNode):
            out.extend(flatten_block(child))
        else:
            out.append(child)
    return out

new_children = flatten_root(root)
new_root = RootNode()
new_root.children = new_children
out = new_root.render()

# quick checks
nested_found = False
if '@media' in out:
    # crude check for nested: look for @media followed before next } by another @media
    import re
    if re.search(r'@media[^{}]*\{[^}]*@media', out):
        nested_found = True

open_braces = out.count('{')
close_braces = out.count('}')

out_path.write_text(out, encoding='utf-8')
print(f'wrote {out_path} — braces: {{ {open_braces} }} vs }} {close_braces} — nested_found={nested_found}')

# exit non-zero if nested or braces mismatch
if nested_found or open_braces != close_braces:
    print('ERROR: still nested or unbalanced braces')
    sys.exit(2)
print('OK')
