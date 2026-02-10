import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ea580c', '#16a34a', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#65a30d', '#c026d3', '#e11d48', '#4f46e5'];

const MONTHS_MARATHI = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [filterMember, setFilterMember] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchData();
  }, [filterMember, filterYear]);

  const fetchData = async () => {
    if (!user) return;

    // Categories
    const { data: cats } = await supabase.from('categories').select('id, name');
    if (cats) {
      const map: Record<string, string> = {};
      cats.forEach(c => { map[c.id] = c.name; });
      setCategories(map);
    }

    // Members for admin filter
    if (isAdmin) {
      const { data: mems } = await supabase.rpc('get_all_members');
      if (mems) setMembers(mems.map((m: any) => ({ id: m.id, name: m.name })));
    }

    // Transactions
    let query = supabase.from('transactions').select('*');
    if (!isAdmin) {
      query = query.eq('member_id', user.id);
    } else if (filterMember !== 'all') {
      query = query.eq('member_id', filterMember);
    }
    query = query.gte('transaction_date', `${filterYear}-01-01`).lte('transaction_date', `${filterYear}-12-31`);

    const { data } = await query;
    if (data) setTransactions(data);
  };

  // Monthly data for bar chart
  const monthlyData = MONTHS_MARATHI.map((month, idx) => {
    const monthTxns = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === idx;
    });
    return {
      month,
      जमा: monthTxns.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0),
      खर्च: monthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  // Category breakdown for pie chart
  const categoryData = Object.entries(
    transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => {
        const cat = categories[t.category_id] || 'इतर';
        acc[cat] = (acc[cat] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-orange-200">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>वर्ष</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label>सदस्य</Label>
                <Select value={filterMember} onValueChange={setFilterMember}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
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

      {/* Monthly Bar Chart */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-900">मासिक जमा व खर्च</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="जमा" fill="#16a34a" />
              <Bar dataKey="खर्च" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Pie Chart */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-900">वर्गवारीनुसार खर्च</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('hi-IN')}`} />
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
