import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

const AddTransaction = ({ onAdded }: { onAdded: () => void }) => {
  const { user, isAdmin } = useAuth();
  const [type, setType] = useState<string>('debit');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('categories').select('id, name').then(({ data }) => {
      if (data) setCategories(data);
    });
    if (isAdmin) {
      supabase.rpc('get_all_members').then(({ data }) => {
        if (data) setMembers(data.map((m: any) => ({ id: m.id, name: m.name })));
      });
    }
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast({ title: 'कृपया योग्य रक्कम टाका', variant: 'destructive' });
      return;
    }
    if (!categoryId) {
      toast({ title: 'कृपया वर्गवारी निवडा', variant: 'destructive' });
      return;
    }
    const memberId = isAdmin && selectedMember ? selectedMember : user?.id;
    if (!memberId) return;

    setLoading(true);
    const { error } = await supabase.from('transactions').insert({
      member_id: memberId,
      type,
      amount: Number(amount),
      category_id: categoryId,
      description: description.trim() || null,
      transaction_date: date,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'व्यवहार जोडता आला नाही', variant: 'destructive' });
    } else {
      toast({ title: type === 'credit' ? 'जमा यशस्वी!' : 'खर्च नोंदवला!' });
      setAmount('');
      setDescription('');
      setCategoryId('');
      onAdded();
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-900 flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> नवीन व्यवहार जोडा
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>प्रकार</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">जमा (Credit)</SelectItem>
                <SelectItem value="debit">खर्च (Debit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>रक्कम (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label>वर्गवारी</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>तारीख</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {isAdmin && (
            <div className="space-y-2">
              <Label>सदस्य</Label>
              <Select value={selectedMember || user?.id || ''} onValueChange={setSelectedMember}>
                <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>वर्णन</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="तपशील लिहा (ऐच्छिक)"
              className="h-10 min-h-[40px]"
              maxLength={200}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? 'जोडत आहे...' : 'जोडा'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTransaction;
