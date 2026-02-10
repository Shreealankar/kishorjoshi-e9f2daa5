import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, PlusCircle, BarChart3, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import MemberManagement from '@/components/MemberManagement';
import TransactionList from '@/components/TransactionList';
import AddTransaction from '@/components/AddTransaction';
import Reports from '@/components/Reports';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ credit: 0, debit: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchSummary();
  }, [user, refreshKey]);

  const fetchSummary = async () => {
    if (!user) return;
    let query = supabase.from('transactions').select('type, amount');
    if (!isAdmin) {
      query = query.eq('member_id', user.id);
    }
    const { data } = await query;
    if (data) {
      const credit = data.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
      const debit = data.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
      setSummary({ credit, debit });
    }
  };

  const refresh = () => setRefreshKey(k => k + 1);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-orange-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">कुटुंब खर्च व्यवस्थापन</h1>
            <p className="text-orange-100 text-sm">
              नमस्कार, {user.name} ({isAdmin ? 'व्यवस्थापक' : 'सदस्य'})
            </p>
          </div>
          <Button variant="ghost" onClick={() => { logout(); navigate('/'); }} className="text-white hover:bg-orange-700">
            <LogOut className="w-4 h-4 mr-2" /> बाहेर पडा
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">एकूण जमा</CardTitle>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-800 flex items-center">
                <IndianRupee className="w-5 h-5" />{summary.credit.toLocaleString('hi-IN')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700">एकूण खर्च</CardTitle>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-800 flex items-center">
                <IndianRupee className="w-5 h-5" />{summary.debit.toLocaleString('hi-IN')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">शिल्लक</CardTitle>
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold flex items-center ${(summary.credit - summary.debit) >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                <IndianRupee className="w-5 h-5" />{(summary.credit - summary.debit).toLocaleString('hi-IN')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="bg-orange-100">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <PlusCircle className="w-4 h-4 mr-1" /> व्यवहार
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-1" /> अहवाल
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="members" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-1" /> सदस्य
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <AddTransaction onAdded={refresh} />
            <TransactionList refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="members">
              <MemberManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
