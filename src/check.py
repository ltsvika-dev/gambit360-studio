"""Checks the Studio before a change goes in. Run it after build.py:

    python check.py                       -> checks ../Gambit360 Studio.html
    python check.py FILE.html             -> checks FILE.html

1. The built HTML matches the pieces (as build.py --check).
2. Every script in it, and every script of the published live-tour page, has valid JavaScript syntax (needs node).
3. upload.php and index.php, as the Studio uploads them, have valid PHP syntax (needs php).

A check whose tool is not installed is skipped with a note (on GitHub all of them run).
Exits with 1 when anything fails, so it also works as the automatic check on GitHub.
"""
import os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build

SCRIPT = re.compile(r'<script(\s[^>]*)?>(.*?)</script>', re.S)
TPL = lambda html, i: (re.search(r'<script type="text/plain" id="' + i + r'">(.*?)</script>', html, re.S) or sys.exit('template ' + i + ' not found')).group(1)

def scripts(html):   # the inline scripts that run (not templates, not src= files)
    for m in SCRIPT.finditer(html):
        attrs = m.group(1) or ''
        if 'src=' in attrs or 'text/plain' in attrs: continue
        yield html[:m.start()].count('\n') + 1, m.group(2)

def run(tool, args, text, suffix):
    with tempfile.NamedTemporaryFile('w', suffix=suffix, delete=False, encoding='utf-8', newline='') as f: f.write(text)
    try: r = subprocess.run([tool] + args + [f.name], capture_output=True, text=True, encoding='utf-8', errors='replace')
    finally: os.unlink(f.name)
    return r.returncode == 0, (r.stdout + r.stderr).replace(f.name, '<piece>').strip()

def main(argv):
    path = argv[0] if argv else os.path.join(HERE, '..', 'Gambit360 Studio.html')
    with open(path, encoding='utf-8', newline='') as f: html = f.read()
    bad = 0
    def report(ok, what, detail=''):
        nonlocal bad
        print(('ok    ' if ok else 'FAIL  ') + what)
        if not ok: bad += 1; print('      ' + detail.replace('\n', '\n      '))

    report(html == build.build(), 'the built HTML matches src/', 'run: python build.py')

    node, php = shutil.which('node'), shutil.which('php')
    page = TPL(html, 'g360LiveTpl').replace('<\\/script>', '</script>')
    if node:
        for where, doc in (('Studio', html), ('published page', page)):
            for line, js in scripts(doc):
                ok, out = run(node, ['--check'], js, '.js')
                out = re.sub(r'<piece>:(\d+)', lambda m: 'line %d' % (int(m.group(1)) + line - 1), out)   # the line in the HTML
                report(ok, 'JavaScript: %s, script at line %d' % (where, line), out)
    else: print('skip  JavaScript (node is not installed)')
    if php:
        for name, i in (('upload.php', 'g360UploadTpl'), ('index.php', 'g360IndexTpl')):
            ok, out = run(php, ['-l'], TPL(html, i), '.php')
            report(ok, 'PHP: ' + name, out)
    else: print('skip  PHP (php is not installed)')

    print('all checks passed' if not bad else '%d check(s) failed' % bad)
    return 1 if bad else 0

if __name__ == '__main__': sys.exit(main(sys.argv[1:]))
