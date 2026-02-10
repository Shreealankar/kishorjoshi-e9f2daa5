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
      _role: 'admin',
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-orange-200">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-900">प्रथम सेटअप</CardTitle>
          <CardDescription className="text-orange-700">
            व्यवस्थापक (Admin) खाते तयार करा
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-orange-800">व्यवस्थापक नाव</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="तुमचे नाव टाका"
                className="border-orange-200"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-orange-800">पासवर्ड</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="पासवर्ड टाका"
                className="border-orange-200"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-orange-800">पासवर्ड पुन्हा टाका</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="पासवर्ड पुन्हा टाका"
                className="border-orange-200"
                maxLength={50}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? 'तयार होत आहे...' : 'व्यवस्थापक तयार करा'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
