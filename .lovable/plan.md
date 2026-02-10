

# Plan: PDF Data Sync Fix + Login Save Feature

## Issue 1: PDF मध्ये सर्व सदस्यांचा डेटा दिसत नाही

**Problem**: When admin selects "सर्व सदस्य" and generates PDF, member names may not appear correctly. Also, Supabase has a default 1000-row limit which could cause missing transactions.

**Fix**:
- Add `.limit(10000)` to the transactions query to fetch all records
- Ensure `memberNames` map is always populated before PDF generation
- Add a "सर्व सदस्य" label in the PDF header when all members are selected vs specific member name

## Issue 2: Login Save (Remember Me)

**Problem**: User wants login credentials to be remembered so they don't have to enter name/password every time.

**Fix**:
- Add a "लॉगिन लक्षात ठेवा" (Remember Me) checkbox on the Login page
- When checked, save encrypted credentials in localStorage
- On next visit, auto-fill the name and password fields
- User can uncheck to clear saved credentials

---

## Technical Details

### Files to modify:

**1. `src/components/Reports.tsx`**
- Add `.limit(10000)` to transactions query to avoid row limit
- Ensure member names are fetched reliably for PDF
- When `filterMember` is a specific member, show that member's name in PDF subtitle

**2. `src/pages/Login.tsx`**
- Add `rememberMe` state with checkbox UI
- On successful login with "Remember Me" checked, save name and password to localStorage (`family_app_remember`)
- On page load, check localStorage and auto-fill fields
- Add "लॉगिन लक्षात ठेवा" checkbox between password field and login button

**3. `src/contexts/AuthContext.tsx`**
- No changes needed - session persistence already works via localStorage

### Security Note:
- Saved credentials will be stored in localStorage (base64 encoded) - acceptable for this family app context where devices are shared within family

