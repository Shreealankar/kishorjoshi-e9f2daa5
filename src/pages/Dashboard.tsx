import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, PlusCircle, LayoutDashboard, History, TrendingUp, TrendingDown, IndianRupee, Calendar, BarChart3, Wallet, RefreshCw, Download } from 'lucide-react';
import MemberManagement from '@/components/MemberManagement';
import TransactionList from '@/components/TransactionList';
import AddTransaction from '@/components/AddTransaction';
import Reports from '@/components/Reports';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const TABS = ['dashboard', 'history', 'reports', 'members'] as const;

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ credit: 0, debit: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const touchStartY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  // Swipe navigation
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchSummary();
  }, [user, refreshKey]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const fetchSummary = async () => {
    if (!user) return;
    let query = supabase.from('transactions').select('type, amount');
    if (!isAdmin) query = query.eq('member_id', user.id);
    const { data } = await query;
    if (data) {
      const credit = data.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
      const debit = data.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
      setSummary({ credit, debit });
    }
  };

  const refresh = () => { setRefreshKey(k => k + 1); setAddOpen(false); };
  const balance = summary.credit - summary.debit;

  // Pull to refresh
  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchSummary();
    setRefreshKey(k => k + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  }, [user]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    const diff = currentY - touchStartY.current;
    if (mainRef.current && mainRef.current.scrollTop === 0 && diff > 0) {
      setPullDistance(Math.min(diff * 0.4, 80));
    }
  };

  const handleTouchEnd = () => {
    // Pull to refresh
    if (pullDistance > 50) {
      handlePullRefresh();
    }
    setPullDistance(0);

    // Swipe navigation
    const diffX = touchStartX.current - touchEndX.current;
    if (Math.abs(diffX) > 60) {
      const availableTabs = isAdmin ? TABS : TABS.filter(t => t !== 'members');
      const currentIdx = availableTabs.indexOf(activeTab as any);
      if (diffX > 0 && currentIdx < availableTabs.length - 1) {
        setActiveTab(availableTabs[currentIdx + 1]);
      } else if (diffX < 0 && currentIdx > 0) {
        setActiveTab(availableTabs[currentIdx - 1]);
      }
    }
    touchEndX.current = 0;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border px-3 sm:px-4 py-3 sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">कुटुंब खर्च व्यवस्थापन</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                👤 {user.name} ({isAdmin ? 'व्यवस्थापक' : 'सदस्य'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 text-xs sm:text-sm px-2 sm:px-4">
                  <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">व्यवहार जोडा</span>
                  <span className="sm:hidden">जोडा</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-border mx-2 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">नवीन व्यवहार जोडा</DialogTitle>
                </DialogHeader>
                <AddTransaction onAdded={refresh} />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }} className="text-muted-foreground hover:text-foreground w-8 h-8 sm:w-10 sm:h-10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div className="flex justify-center py-2 transition-all" style={{ height: pullDistance }}>
          <RefreshCw className={`w-5 h-5 text-primary transition-transform ${pullDistance > 50 ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        </div>
      )}
      {isRefreshing && (
        <div className="flex justify-center py-2">
          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
        </div>
      )}

      <main
        ref={mainRef}
        className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Desktop Tabs */}
          <div className="hidden md:block">
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
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-0">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">डॅशबोर्ड</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-[hsl(145,60%,35%)] bg-card p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">शिल्लक</span>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(145,60%,45%)]" />
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-[hsl(145,60%,45%)]' : 'text-destructive'}`}>
                  ₹{balance.toLocaleString('hi-IN')}
                </p>
              </div>
              <div className="rounded-xl border border-[hsl(160,50%,35%)] bg-card p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">एकूण उत्पन्न</span>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(145,60%,45%)]" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[hsl(145,60%,45%)]">₹{summary.credit.toLocaleString('hi-IN')}</p>
              </div>
              <div className="rounded-xl border border-[hsl(30,80%,45%)] bg-card p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">एकूण खर्च</span>
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(30,80%,55%)]" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[hsl(30,80%,55%)]">₹{summary.debit.toLocaleString('hi-IN')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-[hsl(45,60%,40%)] bg-gradient-to-r from-card to-[hsl(45,20%,12%)] p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">सरासरी दैनिक खर्च</span>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(45,60%,55%)]" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[hsl(145,60%,45%)]">₹{summary.debit > 0 ? Math.round(summary.debit / 30).toLocaleString('hi-IN') : '0'}</p>
              </div>
              <div className="rounded-xl border border-[hsl(270,40%,40%)] bg-gradient-to-r from-card to-[hsl(270,20%,14%)] p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">सरासरी दैनिक उत्पन्न</span>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(270,60%,60%)]" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[hsl(145,60%,45%)]">₹{summary.credit > 0 ? Math.round(summary.credit / 30).toLocaleString('hi-IN') : '0'}</p>
              </div>
              <div className="rounded-xl border border-[hsl(200,40%,35%)] bg-card p-4 sm:p-5 space-y-2 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">एकूण व्यवहार</span>
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(200,50%,55%)]" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">₹{(summary.credit + summary.debit).toLocaleString('hi-IN')}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <TransactionList refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <Reports />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="members" className="mt-0">
              <MemberManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="hidden md:block border-t border-border py-4 text-center text-sm text-muted-foreground">
        <p>Developed By Shree Software</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-2 py-1 safe-bottom">
        <div className="flex items-center justify-around">
          <button onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">डॅशबोर्ड</span>
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-colors ${activeTab === 'history' ? 'text-primary' : 'text-muted-foreground'}`}>
            <History className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">व्यवहार</span>
          </button>
          <button onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'text-primary' : 'text-muted-foreground'}`}>
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">अहवाल</span>
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('members')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-colors ${activeTab === 'members' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">सदस्य</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
