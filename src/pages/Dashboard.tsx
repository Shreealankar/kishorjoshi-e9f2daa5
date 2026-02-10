import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, PlusCircle, LayoutDashboard, History, Settings, TrendingUp, TrendingDown, IndianRupee, Calendar, BarChart3, Wallet } from 'lucide-react';
import MemberManagement from '@/components/MemberManagement';
import TransactionList from '@/components/TransactionList';
import AddTransaction from '@/components/AddTransaction';
import Reports from '@/components/Reports';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ credit: 0, debit: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

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

  const refresh = () => { setRefreshKey(k => k + 1); setAddOpen(false); };
  const balance = summary.credit - summary.debit;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">कुटुंब खर्च व्यवस्थापन</h1>
              <p className="text-xs text-muted-foreground">
                👤 {user.name} ({isAdmin ? 'व्यवस्थापक' : 'सदस्य'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard?tab=members')} className="text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" onClick={() => { logout(); navigate('/'); }} className="text-muted-foreground hover:text-foreground gap-2">
              <LogOut className="w-4 h-4" /> बाहेर पडा
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
                <LayoutDashboard className="w-4 h-4" /> डॅशबोर्ड
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
                <History className="w-4 h-4" /> व्यवहार इतिहास
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
                <BarChart3 className="w-4 h-4" /> अहवाल
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
                  <Users className="w-4 h-4" /> सदस्य
                </TabsTrigger>
              )}
            </TabsList>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <PlusCircle className="w-4 h-4" /> व्यवहार जोडा
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">नवीन व्यवहार जोडा</DialogTitle>
                </DialogHeader>
                <AddTransaction onAdded={refresh} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">डॅशबोर्ड</h2>

            {/* Summary Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* शिल्लक - Green border */}
              <div className="rounded-xl border border-[hsl(145,60%,35%)] bg-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">शिल्लक</span>
                  <TrendingUp className="w-5 h-5 text-[hsl(145,60%,45%)]" />
                </div>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-destructive'}`}>
                  ₹{balance.toLocaleString('hi-IN')}
                </p>
              </div>

              {/* एकूण उत्पन्न - Green/teal gradient border */}
              <div className="rounded-xl border border-[hsl(160,50%,35%)] bg-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">एकूण उत्पन्न</span>
                  <TrendingUp className="w-5 h-5 text-[hsl(145,60%,45%)]" />
                </div>
                <p className="text-2xl font-bold text-[hsl(145,60%,45%)]">
                  ₹{summary.credit.toLocaleString('hi-IN')}
                </p>
              </div>

              {/* एकूण खर्च - Orange border */}
              <div className="rounded-xl border border-[hsl(30,80%,45%)] bg-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">एकूण खर्च</span>
                  <TrendingDown className="w-5 h-5 text-[hsl(30,80%,55%)]" />
                </div>
                <p className="text-2xl font-bold text-[hsl(30,80%,55%)]">
                  ₹{summary.debit.toLocaleString('hi-IN')}
                </p>
              </div>
            </div>

            {/* Summary Cards Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* सरासरी दैनिक खर्च */}
              <div className="rounded-xl border border-[hsl(45,60%,40%)] bg-gradient-to-r from-card to-[hsl(45,20%,12%)] p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">सरासरी दैनिक खर्च</span>
                  <Calendar className="w-5 h-5 text-[hsl(45,60%,55%)]" />
                </div>
                <p className="text-2xl font-bold text-[hsl(145,60%,45%)]">
                  ₹{summary.debit > 0 ? Math.round(summary.debit / 30).toLocaleString('hi-IN') : '0'}
                </p>
              </div>

              {/* सरासरी दैनिक उत्पन्न */}
              <div className="rounded-xl border border-[hsl(270,40%,40%)] bg-gradient-to-r from-card to-[hsl(270,20%,14%)] p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">सरासरी दैनिक उत्पन्न</span>
                  <Calendar className="w-5 h-5 text-[hsl(270,60%,60%)]" />
                </div>
                <p className="text-2xl font-bold text-[hsl(145,60%,45%)]">
                  ₹{summary.credit > 0 ? Math.round(summary.credit / 30).toLocaleString('hi-IN') : '0'}
                </p>
              </div>

              {/* एकूण व्यवहार */}
              <div className="rounded-xl border border-[hsl(200,40%,35%)] bg-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">एकूण व्यवहार</span>
                  <IndianRupee className="w-5 h-5 text-[hsl(200,50%,55%)]" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ₹{(summary.credit + summary.debit).toLocaleString('hi-IN')}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <TransactionList refreshKey={refreshKey} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Reports />
          </TabsContent>

          {/* Members Tab (Admin) */}
          {isAdmin && (
            <TabsContent value="members">
              <MemberManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <p>Developed By Shree Software</p>
      </footer>
    </div>
  );
};

export default Dashboard;
