import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Users } from 'lucide-react';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-orange-200">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-900">
            कुटुंब खर्च व्यवस्थापन
          </CardTitle>
          <CardDescription className="text-orange-700">
            कृपया आपले नाव आणि पासवर्ड टाका
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-orange-800 font-medium">सदस्य नाव</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="तुमचे नाव टाका"
                className="border-orange-200 focus-visible:ring-orange-400"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-orange-800 font-medium">पासवर्ड</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="पासवर्ड टाका"
                className="border-orange-200 focus-visible:ring-orange-400"
                maxLength={50}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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
