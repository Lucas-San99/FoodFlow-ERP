import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserDialog } from "./UserDialog";

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadUsers = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      toast.error("Erro ao carregar usuários");
      return;
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      toast.error("Erro ao carregar roles");
      return;
    }

    const usersWithRoles = profilesData?.map((profile) => {
      const userRole = rolesData?.find((role) => role.user_id === profile.id);
      return {
        ...profile,
        role: userRole?.role || null,
      };
    });

    setUsers(usersWithRoles || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    // Note: This will cascade delete the profile and roles due to foreign key constraints
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      toast.error("Erro ao excluir usuário");
      return;
    }

    toast.success("Usuário excluído com sucesso!");
    loadUsers();
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      waiter: "Garçom",
      kitchen: "Cozinha",
    };

    return <Badge>{labels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{user.full_name}</CardTitle>
                {user.role && getRoleBadge(user.role)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">ID: {user.id}</p>
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => handleDelete(user.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadUsers}
      />
    </div>
  );
}