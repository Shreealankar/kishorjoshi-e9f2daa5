import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, IndianRupee } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  member_id: string;
  category_id: string | null;
  categories?: { name: string } | null;
}

const TransactionList = ({ refreshKey }: { refreshKey: number }) => {
  const { user, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
    if (isAdmin) fetchMemberNames();
  }, [refreshKey, user]);

  const fetchMemberNames = async () => {
    const { data } = await supabase.rpc('get_all_members');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((m: any) => { map[m.id] = m.name; });
      setMemberNames(map);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    let query = supabase
      .from('transactions')
      .select('*, categories(name)')
      .order('transaction_date', { ascending: false })
      .limit(50);

    if (!isAdmin) {
      query = query.eq('member_id', user.id);
    }

    const { data } = await query;
    if (data) setTransactions(data as Transaction[]);
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('हा व्यवहार हटवायचा आहे का?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      toast({ title: 'हटवता आले नाही', variant: 'destructive' });
    } else {
      toast({ title: 'व्यवहार हटवला!' });
      fetchTransactions();
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-900">व्यवहार यादी</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>तारीख</TableHead>
              {isAdmin && <TableHead>सदस्य</TableHead>}
              <TableHead>प्रकार</TableHead>
              <TableHead>वर्गवारी</TableHead>
              <TableHead>वर्णन</TableHead>
              <TableHead className="text-right">रक्कम</TableHead>
              <TableHead className="text-right">क्रिया</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(t => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.transaction_date).toLocaleDateString('mr-IN')}</TableCell>
                {isAdmin && <TableCell>{memberNames[t.member_id] || '-'}</TableCell>}
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${t.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {t.type === 'credit' ? 'जमा' : 'खर्च'}
                  </span>
                </TableCell>
                <TableCell>{t.categories?.name || '-'}</TableCell>
                <TableCell className="max-w-[150px] truncate">{t.description || '-'}</TableCell>
                <TableCell className={`text-right font-medium ${t.type === 'credit' ? 'text-green-700' : 'text-red-700'}`}>
                  <span className="flex items-center justify-end">
                    {t.type === 'credit' ? '+' : '-'}<IndianRupee className="w-3 h-3" />{Number(t.amount).toLocaleString('hi-IN')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="destructive" onClick={() => deleteTransaction(t.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                  कोणतेही व्यवहार नाहीत
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
