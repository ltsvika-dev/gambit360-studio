if (!empty($G360_APP) || isset($_GET['app'])) {   // app/index.php: the Studio itself, or the sign-in page (user name and password)
  header('X-Robots-Tag: noindex'); header('Cache-Control: no-store'); header('Referrer-Policy: no-referrer'); header('X-Frame-Options: DENY');
  if ($keyOk && appOk($KEY_SHA256) && is_file($bd . '/app.html')) { header('Content-Type: text/html; charset=utf-8'); readfile($bd . '/app.html'); exit; }
  header('Content-Type: text/html; charset=utf-8');
  $none = $keyOk && appOk($KEY_SHA256);   // signed in, but no Studio was uploaded yet
  $S = '<' . 'script>'; $E = '<' . '/script>';
  $logo = strpos($LOGO, 'data:image/') === 0 ? '<div class="lg"><img src="' . $LOGO . '" alt="Gambit360"></div>' : '<div class="lg txt">Gambit<b>360</b></div>';
  echo '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#0b1113"><title>Gambit360 Studio</title>',
    '<style>:root{color-scheme:dark;--ac:#5ec4b6;--ac2:#2f8fd8}*{box-sizing:border-box}',
    'body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:16px;color:#e8eef0;font:16px/1.45 system-ui,"Segoe UI",Arial,sans-serif;',
    'background:radial-gradient(900px 520px at 85% -10%,rgba(47,143,216,.22),transparent 60%),radial-gradient(800px 520px at 0% 110%,rgba(94,196,182,.18),transparent 60%),#0b1113}',
    '.card{width:min(380px,100%);background:rgba(20,28,31,.92);border:1px solid #26363a;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.45)}',
    '.lg{background:#fff;margin:26px 26px 0;padding:14px 18px;border-radius:10px;display:flex;justify-content:center}.lg img{display:block;width:100%;max-width:280px;height:auto}.lg.txt{color:#14286b;font:800 1.9rem system-ui,sans-serif;direction:ltr}.lg.txt b{color:#2f8fd8}',
    '.in{padding:22px 26px 26px}h1{margin:0;font-size:1.3rem;font-weight:700}.en{display:block;color:#8ea4a9;font-size:.84rem;font-weight:400;margin-top:2px}',
    'label{display:block;margin:20px 0 6px;font-size:.88rem;color:#b9c9cc}.pw{position:relative}',
    'input{width:100%;height:46px;padding:0 14px 0 46px;border-radius:10px;border:1px solid #33464b;background:#0d1416;color:inherit;font:inherit;direction:ltr;outline:0;transition:border-color .15s,box-shadow .15s}',
    '#u{padding:0 14px}input:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(94,196,182,.22)}',
    '.eye{position:absolute;top:0;left:0;width:46px;height:46px;border:0;background:none;color:#8ea4a9;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:10px}.eye:hover{color:#e8eef0}.eye svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.eye .x{display:none}.eye.on .x{display:inline}',
    '.go{margin-top:16px;width:100%;height:46px;border:0;border-radius:10px;background:var(--ac);color:#0b1412;font:inherit;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:filter .15s,transform .05s}',
    '.go:hover{filter:brightness(1.07)}.go:active{transform:translateY(1px)}.go:disabled{filter:saturate(.4);cursor:default}',
    '.sp{width:18px;height:18px;border:2.5px solid rgba(6,32,28,.3);border-top-color:#06201c;border-radius:50%;animation:r .8s linear infinite;display:none}.busy .sp{display:block}@keyframes r{to{transform:rotate(360deg)}}',
    '#m{min-height:1.3em;white-space:pre-line;margin-top:12px;color:#ff9a8a;font-size:.88rem}.note{margin:4px 0 0;color:#7f9499;font-size:.8rem}p{margin:16px 0 0;color:#b9c9cc;font-size:.92rem}',
    '.ft{color:#6f8489;font-size:.8rem;text-decoration:none}.ft:hover{color:#b9c9cc}</style></head><body><main class="card">', $logo, '<div class="in">',
    $none ? '<h1>הסטודיו עוד לא בשרת<span class="en">No Studio on the server yet</span></h1><p>פתחו את הסטודיו במחשב שלכם: סיורים חיים ← אפשרויות ← "עדכון הסטודיו בשרת".</p><p class="note" dir="ltr" style="text-align:right">In your own Studio: Live tours, Options, "Update the Studio in the cloud".</p></div></main>'
      : '<form id="f"><h1>כניסה לסטודיו<span class="en">Sign in to Gambit360 Studio</span></h1>' .
        '<label for="u">שם משתמש · User name</label><input id="u" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>' .
        '<label for="p">סיסמת הענן · Cloud password</label><div class="pw"><input id="p" name="password" type="password" autocomplete="current-password" required>' .
        '<button type="button" class="eye" id="eye" aria-label="הצגת הסיסמה · Show password" title="הצגת הסיסמה · Show password"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="x" d="M4 4l16 16"/></svg></button></div>' .
        '<button class="go" id="go"><span class="sp"></span><span>כניסה · Sign in</span></button><div id="m" role="alert"></div>' .
        '<p class="note">המכשיר הזה יישאר מחובר 30 יום<br>This device stays signed in for 30 days</p></form></div></main>' .
        $S . 'const f=document.getElementById("f"),m=document.getElementById("m"),p=document.getElementById("p"),u=document.getElementById("u"),go=document.getElementById("go"),eye=document.getElementById("eye"),b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));' .
        'try{u.value=localStorage.getItem("g360user")||"";}catch(x){}(u.value?p:u).focus();' .
        'eye.onclick=()=>{const on=p.type==="password";p.type=on?"text":"password";eye.classList.toggle("on",on);p.focus();};' .
        'const busy=b=>{go.disabled=b;go.classList.toggle("busy",b);};' .
        'f.onsubmit=async e=>{e.preventDefault();m.textContent="";busy(true);const pw=p.value;try{const fd=new FormData();fd.append("action","login");fd.append("user",u.value);fd.append("pass",pw);' .
        'const j=await (await fetch("../upload.php",{method:"POST",body:fd,credentials:"same-origin",cache:"no-store"})).json();' .
        'if(!j.ok){busy(false);m.textContent=j.error==="wait"?"יותר מדי ניסיונות. נסו שוב בעוד רבע שעה\nToo many tries, wait 15 minutes":j.error==="nopass"?"עוד לא נקבעה סיסמה בסטודיו\nNo password was set yet":"שם משתמש או סיסמה שגויים\nWrong user name or password";p.select();return;}' .
        'const w=JSON.parse(j.wrap),k0=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]),' .
        'k=await crypto.subtle.deriveKey({name:"PBKDF2",salt:b64(w.salt),iterations:w.it,hash:"SHA-256"},k0,{name:"AES-GCM",length:256},false,["decrypt"]),' .
        'key=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(w.iv)},k,b64(w.ct)));' .
        'localStorage.setItem("g360cloudKey",key);localStorage.setItem("g360user",u.value.trim());location.reload();}catch(x){busy(false);m.textContent=String(x&&x.message||x);}};' . $E,
    '<a class="ft" href="https://gambit360.co.il/" target="_blank" rel="noopener">gambit360.co.il</a></body></html>';
  exit;
}
