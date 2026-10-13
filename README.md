# Gambit360 Studio

`Gambit360 Studio.html` נבנה מהחלקים שב-`src/` (ראו `src/README.md`): `python src/build.py`.
אין לערוך את ה-HTML הבנוי ישירות.

- `src/` – קוד המקור, כולל `live-tours/` (upload.php, index.php, הדף המתפרסם).
- `מצב נוכחי.md` – תיאור המצב הנוכחי של הסטודיו.
- `lib/` (three.js וספריות נוספות) נמצאת רק במחשב, ליד ה-HTML, ולא נשמרת כאן.
- התיקיות `_backup/` ו-`screens/` לא נשמרות כאן.
- ב-`upload.php` המפתח הוא `@@KEYHASH@@`; הסטודיו ממלא אותו בזמן הפרסום, ואין סיסמאות או מפתחות בקוד.
