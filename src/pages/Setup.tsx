import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';

const Setup = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      toast({ title: 'कृपया सर्व माहिती भरा', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'पासवर्ड जुळत नाही', variant: 'destructive' });
      return;
    }
    if (password.length < 4) {
      toast({ title: 'पासवर्ड किमान ४ अक्षरांचा असावा', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.rpc('create_member', {
      _name: name.trim(),
      _password: password,
      _role: 'admin' as 'admin' | 'member',
    });
    setLoading(false);

    if (error) {
      toast({ title: 'व्यवस्थापक तयार करता आला नाही', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'व्यवस्थापक खाते तयार झाले! कृपया लॉगिन करा.' });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">प्रथम सेटअप</CardTitle>
          <CardDescription className="text-muted-foreground">
            व्यवस्थापक (Admin) खाते तयार करा
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">व्यवस्थापक नाव</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="तुमचे नाव टाका" className="bg-secondary border-border" maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">पासवर्ड</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="पासवर्ड टाका" className="bg-secondary border-border" maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">पासवर्ड पुन्हा टाका</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="पासवर्ड पुन्हा टाका" className="bg-secondary border-border" maxLength={50} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? 'तयार होत आहे...' : 'व्यवस्थापक तयार करा'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
