# מונדיאל 2026 — ניתוח חי

אתר שמתעדכן אוטומטית עם תוצאות, סיכויי זכייה והמלצות הימורים, מבוסס Gemini API.

## העלאה ל-Vercel (פעם אחת)

### שלב 1 — העלאה ל-GitHub
1. צור repository חדש ב-GitHub (פרטי או ציבורי)
2. העלה את כל הקבצים מהתיקייה הזו אליו

### שלב 2 — חיבור ל-Vercel
1. היכנס ל-https://vercel.com והתחבר עם GitHub
2. לחץ "Add New… → Project"
3. בחר את ה-repository שיצרת
4. **לפני שתלחץ Deploy** — פתח "Environment Variables" והוסף:
   - Name: `GEMINI_API_KEY`
   - Value: ה-API Key שלך (מ-aistudio.google.com)
5. לחץ "Deploy"

### שלב 3 — קבל את הלינק
לאחר ~דקה תקבל URL קבוע כמו `worldcup-2026.vercel.app` — זה הלינק לשתף עם אשתך.

## עדכון עתידי
כל שינוי שתעלה ל-GitHub יתעדכן אוטומטית ב-Vercel.

## אבטחה
ה-API Key יושב רק ב-Vercel (Environment Variable) ולעולם לא נחשף בדפדפן.
