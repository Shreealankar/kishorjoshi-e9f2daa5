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

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.rpc('get_all_members');
    if (data) setMembers(data as Member[]);
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
      setNewName(''); setNewPassword(''); setNewRole('member'); setIsOpen(false);
      fetchMembers();
    }
  };

  const deleteMember = async (id: string, name: string) => {
    if (!confirm(`"${name}" या सदस्याला हटवायचे आहे का?`)) return;
    const { error } = await supabase.rpc('delete_member', { _member_id: id });
    if (error) {
      toast({ title: 'हटवता आले नाही', variant: 'destructive' });
    } else {
      toast({ title: 'सदस्य हटवला!' }); fetchMembers();
    }
  };

  const resetPassword = async (id: string, name: string) => {
    const newPwd = prompt(`"${name}" साठी नवीन पासवर्ड टाका:`);
    if (!newPwd || newPwd.length < 4) {
      if (newPwd) toast({ title: 'पासवर्ड किमान ४ अक्षरांचा असावा', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.rpc('update_member_password', { _member_id: id, _new_password: newPwd });
    if (error) {
      toast({ title: 'पासवर्ड बदलता आला नाही', variant: 'destructive' });
    } else {
      toast({ title: 'पासवर्ड यशस्वीरित्या बदलला!' });
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">सदस्य व्यवस्थापन</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <UserPlus className="w-4 h-4" /> नवीन सदस्य
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">नवीन सदस्य जोडा</DialogTitle>
              <DialogDescription className="text-muted-foreground">कुटुंबातील नवीन सदस्याची माहिती भरा</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">नाव</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="सदस्याचे नाव" className="bg-secondary border-border" maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">पासवर्ड</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="पासवर्ड" className="bg-secondary border-border" maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">भूमिका</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="member">सदस्य</SelectItem>
                    <SelectItem value="admin">व्यवस्थापक</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addMember} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? 'जोडत आहे...' : 'जोडा'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">नाव</TableHead>
              <TableHead className="text-muted-foreground">भूमिका</TableHead>
              <TableHead className="text-muted-foreground">तारीख</TableHead>
              <TableHead className="text-right text-muted-foreground">क्रिया</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(m => (
              <TableRow key={m.id} className="border-border">
                <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.role === 'admin' ? 'व्यवस्थापक' : 'सदस्य'}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(m.created_at).toLocaleDateString('mr-IN')}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => resetPassword(m.id, m.name)} className="border-border">
                    <KeyRound className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMember(m.id, m.name)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">कोणतेही सदस्य नाहीत</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MemberManagement;
