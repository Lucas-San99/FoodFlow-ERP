import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { TableList } from "@/components/waiter/TableList";
import { NewTableDialog } from "@/components/waiter/NewTableDialog";
import { OrderDialog } from "@/components/waiter/OrderDialog";

export default function Waiter() {
  const { signOut, user } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [newTableOpen, setNewTableOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const loadTables = async () => {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("table_number");

    if (error) {
      toast.error("Erro ao carregar mesas");
      return;
    }

    setTables(data || []);
  };

  useEffect(() => {
    loadTables();

    // Realtime updates
    const channel = supabase
      .channel("tables-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        () => {
          loadTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenTable = (table: any) => {
    setSelectedTable(table);
    setOrderDialogOpen(true);
  };

  const handleCloseTable = async (tableId: string) => {
    const { error } = await supabase
      .from("tables")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", tableId);

    if (error) {
      toast.error("Erro ao fechar mesa");
      return;
    }

    toast.success("Mesa fechada com sucesso!");
    loadTables();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-primary">Garçom - Mesas</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gerenciar Mesas</h2>
          <Button onClick={() => setNewTableOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Mesa
          </Button>
        </div>

        <TableList
          tables={tables}
          onOpenTable={handleOpenTable}
          onCloseTable={handleCloseTable}
        />
      </main>

      <NewTableDialog
        open={newTableOpen}
        onOpenChange={setNewTableOpen}
        onSuccess={loadTables}
        waiterId={user?.id || ""}
      />

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        table={selectedTable}
        onSuccess={loadTables}
      />
    </div>
  );
}