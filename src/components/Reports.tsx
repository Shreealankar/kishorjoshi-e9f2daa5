import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(145,60%,45%)', 'hsl(270,60%,55%)', 'hsl(30,80%,55%)', 'hsl(200,50%,55%)', 'hsl(340,60%,55%)', 'hsl(45,70%,50%)', 'hsl(180,50%,45%)', 'hsl(100,50%,45%)', 'hsl(300,50%,55%)', 'hsl(15,70%,50%)', 'hsl(220,60%,55%)'];

const MONTHS_MARATHI = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
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
      if (mems) setMembers(mems.map((m: any) => ({ id: m.id, name: m.name })));
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

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">वर्ष</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[120px] bg-secondary border-border"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="w-[150px] bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">सर्व सदस्य</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">मासिक जमा व खर्च</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,20%)" />
              <XAxis dataKey="month" fontSize={11} tick={{ fill: 'hsl(215,15%,55%)' }} />
              <YAxis fontSize={11} tick={{ fill: 'hsl(215,15%,55%)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(225,20%,12%)', border: '1px solid hsl(225,15%,20%)', color: 'hsl(210,40%,92%)' }} />
              <Legend />
              <Bar dataKey="जमा" fill="hsl(145,60%,45%)" />
              <Bar dataKey="खर्च" fill="hsl(30,80%,55%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">वर्गवारीनुसार खर्च</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100} dataKey="value">
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('hi-IN')}`}
                  contentStyle={{ backgroundColor: 'hsl(225,20%,12%)', border: '1px solid hsl(225,15%,20%)', color: 'hsl(210,40%,92%)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">खर्चाची माहिती उपलब्ध नाही</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
