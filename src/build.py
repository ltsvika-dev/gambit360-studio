"""Builds "Gambit360 Studio.html" (one file, as always) from the pieces in this folder.

Usage:  python build.py                 -> writes ../Gambit360 Studio.html
        python build.py OUT.html        -> writes OUT.html
        python build.py --check FILE    -> only tells whether FILE matches what would be built

"Gambit360 Studio.src.html" is the page itself; every @@include(path)@@ in it is replaced by that
file's exact text (paths are relative to this folder; included files may include others).
An @@include that stands alone on its line replaces the whole line, its line break included
(each piece ends with its own line break).
Nothing else is changed, so the result is byte-for-byte what the pieces say, except @@BUILD@@:
it becomes a short fingerprint of the whole result, so a running Studio knows which build it is
(the Studio online is compared with it to see whether it needs updating).
"""
import hashlib, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
INC = re.compile(r'@@include\(([^)]+)\)@@')
LINE = re.compile(r'^@@include\(([^)]+)\)@@\n', re.M)

def read(rel, stack=()):
    if rel in stack: sys.exit('include loop: ' + ' -> '.join(stack + (rel,)))
    with open(os.path.join(HERE, rel), encoding='utf-8', newline='') as f: text = f.read()
    text = LINE.sub(lambda m: read(m.group(1), stack + (rel,)), text)
    return INC.sub(lambda m: read(m.group(1), stack + (rel,)), text)

def build():
    text = read('Gambit360 Studio.src.html')
    return text.replace('@@BUILD@@', hashlib.sha256(text.encode('utf-8')).hexdigest()[:12])

def main(argv):
    out = build()
    if argv[:1] == ['--check']:
        with open(argv[1], encoding='utf-8', newline='') as f: same = f.read() == out
        print('identical' if same else 'DIFFERENT'); return 0 if same else 1
    dest = argv[0] if argv else os.path.join(HERE, '..', 'Gambit360 Studio.html')
    with open(dest, 'w', encoding='utf-8', newline='') as f: f.write(out)
    print('built', os.path.abspath(dest), len(out.encode('utf-8')), 'bytes'); return 0

if __name__ == '__main__': sys.exit(main(sys.argv[1:]))
