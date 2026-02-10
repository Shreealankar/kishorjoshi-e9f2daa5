

# कुटुंब खर्च व्यवस्थापन (Family Expenses Management App)

A Marathi-language family expense tracker with admin-managed members, credit/debit tracking, categories, and reports — backed by Supabase.

---

## 1. Login System (लॉगिन)
- Simple login with **सदस्य नाव (Member Name)** and **पासवर्ड (Password)** — no email required
- Admin account created first, admin can add/remove family members
- Each member gets their own login credentials

## 2. Admin Dashboard (व्यवस्थापक पॅनेल)
- **Add/edit/delete family members** with name and password
- **View all members' transactions** — full visibility of credit and debit
- Overview of total family income vs expenses

## 3. Member Dashboard (सदस्य पॅनेल)
- Each member sees **only their own** credit/debit entries
- Quick summary: total जमा (credit), total खर्च (debit), शिल्लक (balance)

## 4. Credit & Debit Management (जमा आणि खर्च)
- **Add जमा (Credit)**: amount, date, description, category
- **Add खर्च (Debit)**: amount, date, description, category
- Edit and delete entries
- **Categories (वर्गवारी)**: भाजीपाला, किराणा, बिल, वैद्यकीय, शिक्षण, प्रवास, इतर etc.

## 5. Reports & Charts (अहवाल आणि तक्ते)
- Monthly/weekly summary with bar/pie charts
- Income vs Expense comparison
- Category-wise breakdown
- Filter by date range and member (admin only)

## 6. Full Marathi UI (संपूर्ण मराठी)
- All labels, buttons, messages, and navigation in Marathi
- Clean, simple design suitable for all ages

## 7. Backend (Supabase)
- **Members table**: name, password (hashed), role (admin/member)
- **Transactions table**: member_id, type (credit/debit), amount, category, description, date
- **Categories table**: predefined Marathi categories
- Row Level Security: members see only their data, admin sees everything

