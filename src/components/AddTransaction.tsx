import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  type: string;
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
    supabase.from('categories').select('id, name, type').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
    if (isAdmin) {
      supabase.rpc('get_all_members').then(({ data }) => {
        if (data) setMembers(data.map((m: any) => ({ id: m.id, name: m.name })));
      });
    }
  }, [isAdmin]);

  // Filter categories based on selected transaction type
  const filteredCategories = categories.filter(
    c => c.type === type || c.type === 'both'
  );

  // Check if selected category is "इतर"
  const selectedCategory = categories.find(c => c.id === categoryId);
  const isOther = selectedCategory?.name === 'इतर';

  // Reset category when type changes
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setCategoryId('');
  };

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
    if (isOther && !description.trim()) {
      toast({ title: 'इतर निवडल्यास कृपया वर्णन लिहा', variant: 'destructive' });
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
      setAmount(''); setDescription(''); setCategoryId('');
      onAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-foreground">प्रकार</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="credit">जमा (Credit)</SelectItem>
            <SelectItem value="debit">खर्च (Debit)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">रक्कम (₹)</Label>
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" className="bg-secondary border-border" />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">वर्गवारी</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="निवडा" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            {filteredCategories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">तारीख</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border" />
      </div>
      {isAdmin && (
        <div className="space-y-2">
          <Label className="text-foreground">सदस्य</Label>
          <Select value={selectedMember || user?.id || ''} onValueChange={setSelectedMember}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="निवडा" /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              {members.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-foreground">
          {isOther ? 'वर्णन (आवश्यक - इतर काय आहे ते लिहा)' : 'वर्णन (ऐच्छिक)'}
        </Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={isOther ? 'इतर म्हणजे काय ते येथे लिहा...' : 'तपशील लिहा (ऐच्छिक)'}
          className={`h-10 min-h-[40px] bg-secondary border-border ${isOther ? 'border-primary ring-1 ring-primary' : ''}`}
          maxLength={200}
        />
      </div>
      <div className="flex items-end md:col-span-2">
        <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {loading ? 'जोडत आहे...' : 'व्यवहार जोडा'}
        </Button>
      </div>
    </form>
  );
};

export default AddTransaction;
