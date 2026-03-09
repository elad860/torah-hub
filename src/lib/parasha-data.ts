// Chumash → Parashot mapping for hierarchical filtering
export const CHUMASH_PARASHOT: Record<string, string[]> = {
  "בראשית": ["בראשית", "נח", "לך לך", "וירא", "חיי שרה", "תולדות", "ויצא", "וישלח", "וישב", "מקץ", "ויגש", "ויחי"],
  "שמות": ["שמות", "וארא", "בא", "בשלח", "יתרו", "משפטים", "תרומה", "תצוה", "כי תשא", "ויקהל", "פקודי"],
  "ויקרא": ["ויקרא", "צו", "שמיני", "תזריע", "מצורע", "אחרי מות", "קדושים", "אמור", "בהר", "בחוקותי"],
  "במדבר": ["במדבר", "נשא", "בהעלותך", "שלח", "קרח", "חוקת", "בלק", "פינחס", "מטות", "מסעי"],
  "דברים": ["דברים", "ואתחנן", "עקב", "ראה", "שופטים", "כי תצא", "כי תבוא", "ניצבים", "וילך", "האזינו", "וזאת הברכה"],
};

export const CHUMASH_NAMES = Object.keys(CHUMASH_PARASHOT);

export const ALL_PARASHOT = Object.values(CHUMASH_PARASHOT).flat();

// Get the Chumash for a given Parasha name
export function getChumashForParasha(parasha: string): string | null {
  for (const [chumash, parashot] of Object.entries(CHUMASH_PARASHOT)) {
    if (parashot.some(p => parasha.includes(p))) {
      return chumash;
    }
  }
  return null;
}
