import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, KeyRound } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

const MemberManagement = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<string>('member');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase.rpc('get_all_members');
    if (data) setMembers(data as Member[]);
    if (error) console.error(error);
  };

  const addMember = async () => {
    if (!newName.trim() || !newPassword.trim()) {
      toast({ title: 'कृपया नाव आणि पासवर्ड भरा', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 4) {
      toast({ title: 'पासवर्ड किमान ४ अक्षरांचा असावा', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc('create_member', {
      _name: newName.trim(),
      _password: newPassword,
      _role: newRole as 'admin' | 'member',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'सदस्य जोडता आला नाही', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'सदस्य यशस्वीरित्या जोडला!' });
      setNewName('');
      setNewPassword('');
      setNewRole('member');
      setIsOpen(false);
      fetchMembers();
    }
  };

  const deleteMember = async (id: string, name: string) => {
    if (!confirm(`"${name}" या सदस्याला हटवायचे आहे का?`)) return;
    const { error } = await supabase.rpc('delete_member', { _member_id: id });
    if (error) {
      toast({ title: 'हटवता आले नाही', variant: 'destructive' });
    } else {
      toast({ title: 'सदस्य हटवला!' });
      fetchMembers();
    }
  };

  const resetPassword = async (id: string, name: string) => {
    const newPwd = prompt(`"${name}" साठी नवीन पासवर्ड टाका:`);
    if (!newPwd || newPwd.length < 4) {
      if (newPwd) toast({ title: 'पासवर्ड किमान ४ अक्षरांचा असावा', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.rpc('update_member_password', {
      _member_id: id,
      _new_password: newPwd,
    });
    if (error) {
      toast({ title: 'पासवर्ड बदलता आला नाही', variant: 'destructive' });
    } else {
      toast({ title: 'पासवर्ड यशस्वीरित्या बदलला!' });
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-orange-900">सदस्य व्यवस्थापन</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <UserPlus className="w-4 h-4 mr-2" /> नवीन सदस्य
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>नवीन सदस्य जोडा</DialogTitle>
              <DialogDescription>कुटुंबातील नवीन सदस्याची माहिती भरा</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>नाव</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="सदस्याचे नाव" maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label>पासवर्ड</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="पासवर्ड" maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label>भूमिका</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">सदस्य</SelectItem>
                    <SelectItem value="admin">व्यवस्थापक</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addMember} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? 'जोडत आहे...' : 'जोडा'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>नाव</TableHead>
              <TableHead>भूमिका</TableHead>
              <TableHead>तारीख</TableHead>
              <TableHead className="text-right">क्रिया</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{m.role === 'admin' ? 'व्यवस्थापक' : 'सदस्य'}</TableCell>
                <TableCell>{new Date(m.created_at).toLocaleDateString('mr-IN')}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => resetPassword(m.id, m.name)}>
                    <KeyRound className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMember(m.id, m.name)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">कोणतेही सदस्य नाहीत</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MemberManagement;
