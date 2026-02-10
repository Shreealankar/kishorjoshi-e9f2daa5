import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText } from 'lucide-react';

const COLORS = ['hsl(145,60%,45%)', 'hsl(270,60%,55%)', 'hsl(30,80%,55%)', 'hsl(200,50%,55%)', 'hsl(340,60%,55%)', 'hsl(45,70%,50%)', 'hsl(180,50%,45%)', 'hsl(100,50%,45%)', 'hsl(300,50%,55%)', 'hsl(15,70%,50%)', 'hsl(220,60%,55%)'];

const MONTHS_MARATHI = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [filterMember, setFilterMember] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => { fetchData(); }, [filterMember, filterYear]);

  const fetchData = async () => {
    if (!user) return;
    const { data: cats } = await supabase.from('categories').select('id, name');
    if (cats) {
      const map: Record<string, string> = {};
      cats.forEach(c => { map[c.id] = c.name; });
      setCategories(map);
    }
    if (isAdmin) {
      const { data: mems } = await supabase.rpc('get_all_members');
      if (mems) {
        setMembers(mems.map((m: any) => ({ id: m.id, name: m.name })));
        const nMap: Record<string, string> = {};
        mems.forEach((m: any) => { nMap[m.id] = m.name; });
        setMemberNames(nMap);
      }
    }
    let query = supabase.from('transactions').select('*');
    if (!isAdmin) query = query.eq('member_id', user.id);
    else if (filterMember !== 'all') query = query.eq('member_id', filterMember);
    query = query.gte('transaction_date', `${filterYear}-01-01`).lte('transaction_date', `${filterYear}-12-31`);
    const { data } = await query;
    if (data) setTransactions(data);
  };

  const monthlyData = MONTHS_MARATHI.map((month, idx) => {
    const monthTxns = transactions.filter(t => new Date(t.transaction_date).getMonth() === idx);
    return {
      month,
      जमा: monthTxns.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0),
      खर्च: monthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  const categoryData = Object.entries(
    transactions.filter(t => t.type === 'debit').reduce((acc, t) => {
      const cat = categories[t.category_id] || 'इतर';
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const creditCategoryData = Object.entries(
    transactions.filter(t => t.type === 'credit').reduce((acc, t) => {
      const cat = categories[t.category_id] || 'इतर';
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);

  // PDF generation using about:blank
  const generatePDF = () => {
    const sortedTxns = [...transactions].sort((a, b) =>
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const txnRows = sortedTxns.map((t, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${new Date(t.transaction_date).toLocaleDateString('mr-IN')}</td>
        ${isAdmin ? `<td>${memberNames[t.member_id] || '-'}</td>` : ''}
        <td style="text-align:center;">
          <span class="type-badge ${t.type === 'credit' ? 'type-credit' : 'type-debit'}">
            ${t.type === 'credit' ? 'जमा' : 'खर्च'}
          </span>
        </td>
        <td>${categories[t.category_id] || 'इतर'}</td>
        <td>${t.description || '-'}</td>
        <td style="text-align:right;font-weight:600;color:${t.type === 'credit' ? '#16a34a' : '#ea580c'};">
          ${t.type === 'credit' ? '+' : '-'}₹${Number(t.amount).toLocaleString('hi-IN')}
        </td>
      </tr>
    `).join('');

    const catRows = categoryData.map((c) => `
      <tr>
        <td>${c.name}</td>
        <td style="text-align:right;color:#ea580c;font-weight:600;">₹${Number(c.value).toLocaleString()}</td>
        <td style="text-align:right;">${totalDebit > 0 ? ((Number(c.value) / totalDebit) * 100).toFixed(1) : 0}%</td>
      </tr>
    `).join('');

    const creditCatRows = creditCategoryData.map((c) => `
      <tr>
        <td>${c.name}</td>
        <td style="text-align:right;color:#16a34a;font-weight:600;">₹${Number(c.value).toLocaleString()}</td>
        <td style="text-align:right;">${totalCredit > 0 ? ((Number(c.value) / totalCredit) * 100).toFixed(1) : 0}%</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>कुटुंब खर्च अहवाल - ${filterYear}</title>
  <style>
    @page { size:A4 portrait; margin:15mm 12mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    html { width:100%; }
    body { font-family:'Segoe UI','Noto Sans Devanagari',system-ui,sans-serif; background:#fff; color:#1f2937; padding:20px; font-size:16px; line-height:1.6; width:100%; min-width:280px; }
    .container { width:100%; max-width:700px; margin:0 auto; }
    .header { text-align:center; padding:24px 0 16px; border-bottom:3px solid #7c3aed; margin-bottom:24px; }
    .header h1 { color:#7c3aed; font-size:28px; font-weight:800; margin-bottom:6px; }
    .header .subtitle { color:#4b5563; font-size:16px; margin-bottom:4px; }
    .header .date { color:#6b7280; font-size:14px; }
    .summary { display:flex; gap:12px; margin-bottom:28px; }
    .summary-card { flex:1; padding:16px 10px; border-radius:10px; border:2px solid #e5e7eb; background:#f9fafb; text-align:center; }
    .summary-card .label { font-size:13px; color:#6b7280; margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
    .summary-card .value { font-size:26px; font-weight:800; }
    .green { color:#16a34a; border-color:#bbf7d0 !important; background:#f0fdf4 !important; }
    .orange { color:#ea580c; border-color:#fed7aa !important; background:#fff7ed !important; }
    .purple { color:#7c3aed; border-color:#ddd6fe !important; background:#f5f3ff !important; }
    .section { margin-bottom:28px; page-break-inside:avoid; }
    .section h2 { font-size:18px; color:#7c3aed; font-weight:700; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #e5e7eb; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th { padding:10px 8px; text-align:left; background:#f3f4f6; color:#374151; font-weight:700; border-bottom:2px solid #d1d5db; font-size:13px; }
    td { padding:9px 8px; border-bottom:1px solid #e5e7eb; vertical-align:middle; }
    tr:nth-child(even) { background:#f9fafb; }
    .footer { text-align:center; padding:20px 0; border-top:2px solid #e5e7eb; margin-top:24px; color:#9ca3af; font-size:12px; }
    .type-badge { padding:4px 12px; border-radius:12px; font-size:12px; font-weight:700; display:inline-block; }
    .type-credit { background:#dcfce7; color:#16a34a; }
    .type-debit { background:#ffedd5; color:#ea580c; }
    .total-row td { font-weight:700; font-size:16px; padding:12px 8px; }
    .no-data { text-align:center; padding:40px 20px; color:#6b7280; font-size:18px; }
    @media print { 
      body { padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; font-size:14px; }
      .no-print { display:none !important; }
      .container { max-width:100%; padding:0; }
      .section { page-break-inside:avoid; }
      .summary-card .value { font-size:20px; }
      table { font-size:12px; }
      th { font-size:11px; padding:8px 6px; }
      td { padding:6px; }
      .total-row td { font-size:13px; }
    }
  </style>
</head>
<body>
  <div class="container">
  <button class="no-print" style="display:block;width:100%;max-width:320px;margin:0 auto 20px;padding:14px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,0.3);" onclick="window.print()">🖨️ प्रिंट / PDF सेव्ह करा</button>
  
  <div class="header">
    <h1>📊 कुटुंब खर्च व्यवस्थापन</h1>
    <p class="subtitle">वार्षिक अहवाल - ${filterYear} | ${user?.name || ''} ${isAdmin ? '(व्यवस्थापक)' : '(सदस्य)'}</p>
    <p class="date">तारीख: ${new Date().toLocaleDateString('mr-IN')}</p>
  </div>

  <div class="summary">
    <div class="summary-card green">
      <div class="label">एकूण जमा</div>
      <div class="value" style="color:#16a34a;">₹${totalCredit.toLocaleString('hi-IN')}</div>
    </div>
    <div class="summary-card orange">
      <div class="label">एकूण खर्च</div>
      <div class="value" style="color:#ea580c;">₹${totalDebit.toLocaleString('hi-IN')}</div>
    </div>
    <div class="summary-card purple">
      <div class="label">शिल्लक</div>
      <div class="value" style="color:${(totalCredit - totalDebit) >= 0 ? '#16a34a' : '#ea580c'};">₹${(totalCredit - totalDebit).toLocaleString('hi-IN')}</div>
    </div>
  </div>

  ${creditCategoryData.length > 0 ? `
  <div class="section">
    <h2>💰 वर्गवारीनुसार जमा (Credit by Category)</h2>
    <table>
      <thead><tr><th>वर्गवारी</th><th style="text-align:right;">रक्कम</th><th style="text-align:right;">टक्केवारी</th></tr></thead>
      <tbody>${creditCatRows}</tbody>
      <tfoot><tr class="total-row" style="border-top:2px solid #d1d5db;"><td>एकूण</td><td style="text-align:right;color:#16a34a;">₹${totalCredit.toLocaleString('hi-IN')}</td><td style="text-align:right;">100%</td></tr></tfoot>
    </table>
  </div>` : ''}

  ${categoryData.length > 0 ? `
  <div class="section">
    <h2>💸 वर्गवारीनुसार खर्च (Debit by Category)</h2>
    <table>
      <thead><tr><th>वर्गवारी</th><th style="text-align:right;">रक्कम</th><th style="text-align:right;">टक्केवारी</th></tr></thead>
      <tbody>${catRows}</tbody>
      <tfoot><tr class="total-row" style="border-top:2px solid #d1d5db;"><td>एकूण</td><td style="text-align:right;color:#ea580c;">₹${totalDebit.toLocaleString('hi-IN')}</td><td style="text-align:right;">100%</td></tr></tfoot>
    </table>
  </div>` : ''}

  <div class="section">
    <h2>📋 सर्व व्यवहार (${transactions.length} व्यवहार)</h2>
    <div style="overflow-x:auto;">
    <table>
      <thead>
        <tr>
          <th style="text-align:center;width:30px;">#</th>
          <th>तारीख</th>
          ${isAdmin ? '<th>सदस्य</th>' : ''}
          <th style="text-align:center;">प्रकार</th>
          <th>वर्गवारी</th>
          <th>वर्णन</th>
          <th style="text-align:right;">रक्कम</th>
        </tr>
      </thead>
      <tbody>${txnRows}</tbody>
      <tfoot>
        <tr class="total-row" style="border-top:2px solid #d1d5db;">
          <td colspan="${isAdmin ? 6 : 5}" style="text-align:right;">एकूण जमा:</td>
          <td style="text-align:right;color:#16a34a;">₹${totalCredit.toLocaleString('hi-IN')}</td>
        </tr>
        <tr class="total-row">
          <td colspan="${isAdmin ? 6 : 5}" style="text-align:right;">एकूण खर्च:</td>
          <td style="text-align:right;color:#ea580c;">₹${totalDebit.toLocaleString('hi-IN')}</td>
        </tr>
        <tr class="total-row" style="border-top:3px solid #7c3aed;background:#f5f3ff;">
          <td colspan="${isAdmin ? 6 : 5}" style="text-align:right;color:#7c3aed;">शिल्लक:</td>
          <td style="text-align:right;color:#7c3aed;font-size:16px;">₹${(totalCredit - totalDebit).toLocaleString('hi-IN')}</td>
        </tr>
      </tfoot>
    </table>
    </div>
  </div>

  <div class="footer">
    <p>Developed By <strong>Shree Software</strong> | Generated on ${new Date().toLocaleString('mr-IN')}</p>
  </div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 800); };</script>
</body>
</html>`;

    const newWindow = window.open('about:blank', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  // Custom pie label for mobile
  const renderCustomLabel = ({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="hsl(210,40%,85%)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters + PDF button */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">वर्ष</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px] sm:w-[120px] bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-foreground">सदस्य</Label>
                <Select value={filterMember} onValueChange={setFilterMember}>
                  <SelectTrigger className="w-[130px] sm:w-[150px] bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">सर्व सदस्य</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={generatePDF} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 ml-auto">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF अहवाल</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-[hsl(145,60%,35%)] bg-card">
          <CardContent className="p-3 sm:p-5">
            <p className="text-[10px] sm:text-xs text-muted-foreground">एकूण जमा</p>
            <p className="text-sm sm:text-xl font-bold text-[hsl(145,60%,45%)] mt-1">₹{totalCredit.toLocaleString('hi-IN')}</p>
          </CardContent>
        </Card>
        <Card className="border-[hsl(30,80%,45%)] bg-card">
          <CardContent className="p-3 sm:p-5">
            <p className="text-[10px] sm:text-xs text-muted-foreground">एकूण खर्च</p>
            <p className="text-sm sm:text-xl font-bold text-[hsl(30,80%,55%)] mt-1">₹{totalDebit.toLocaleString('hi-IN')}</p>
          </CardContent>
        </Card>
        <Card className="border-primary bg-card">
          <CardContent className="p-3 sm:p-5">
            <p className="text-[10px] sm:text-xs text-muted-foreground">शिल्लक</p>
            <p className={`text-sm sm:text-xl font-bold mt-1 ${(totalCredit - totalDebit) >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-destructive'}`}>
              ₹{(totalCredit - totalDebit).toLocaleString('hi-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-foreground text-sm sm:text-base">मासिक जमा व खर्च</CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,20%)" />
              <XAxis dataKey="month" fontSize={9} tick={{ fill: 'hsl(215,15%,55%)' }} interval={0} angle={-45} textAnchor="end" height={50} />
              <YAxis fontSize={10} tick={{ fill: 'hsl(215,15%,55%)' }} width={45} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(225,20%,12%)', border: '1px solid hsl(225,15%,20%)', color: 'hsl(210,40%,92%)', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="जमा" fill="hsl(145,60%,45%)" />
              <Bar dataKey="खर्च" fill="hsl(30,80%,55%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Debit */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-foreground text-sm sm:text-base">वर्गवारीनुसार खर्च</CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-6">
          {categoryData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%"
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 70 : 100}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('hi-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(225,20%,12%)', border: '1px solid hsl(225,15%,20%)', color: 'hsl(210,40%,92%)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend list for mobile */}
              <div className="grid grid-cols-2 gap-1 mt-2 sm:hidden">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-foreground font-medium">₹{Number(c.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">खर्चाची माहिती उपलब्ध नाही</p>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart - Credit */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-foreground text-sm sm:text-base">वर्गवारीनुसार जमा</CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-6">
          {creditCategoryData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={creditCategoryData} cx="50%" cy="50%"
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 70 : 100}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {creditCategoryData.map((_, index) => (
                      <Cell key={`cell-c-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('hi-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(225,20%,12%)', border: '1px solid hsl(225,15%,20%)', color: 'hsl(210,40%,92%)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2 sm:hidden">
                {creditCategoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-foreground font-medium">₹{Number(c.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">जमाची माहिती उपलब्ध नाही</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
