import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Wallet } from 'lucide-react';

const REMEMBER_KEY = 'family_app_remember';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        const { n, p } = JSON.parse(atob(saved));
        setName(n);
        setPassword(p);
        setRememberMe(true);
      }
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      toast({ title: 'कृपया सर्व माहिती भरा', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const success = await login(name.trim(), password);
    setIsLoading(false);
    if (success) {
      toast({ title: 'लॉगिन यशस्वी!' });
      navigate('/dashboard');
    } else {
      toast({ title: 'चुकीचे नाव किंवा पासवर्ड', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            कुटुंब खर्च व्यवस्थापन
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            कृपया आपले नाव आणि पासवर्ड टाका
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">सदस्य नाव</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="तुमचे नाव टाका"
                className="bg-secondary border-border"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">पासवर्ड</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="पासवर्ड टाका"
                className="bg-secondary border-border"
                maxLength={50}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'लॉगिन होत आहे...' : 'लॉगिन करा'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
