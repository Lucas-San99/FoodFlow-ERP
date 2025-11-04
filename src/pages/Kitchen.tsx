import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Kitchen() {
  const { signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        menu_items (name),
        tables (table_number),
        profiles!orders_waiter_id_fkey (full_name)
      `)
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      return;
    }

    setOrders(data || []);
  };

  useEffect(() => {
    loadOrders();

    // Realtime updates
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCompleteOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "ready",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      toast.error("Erro ao completar pedido");
      return;
    }

    toast.success("Pedido pronto!");
    loadOrders();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--kitchen-bg))" }}>
      <header className="border-b" style={{ backgroundColor: "hsl(var(--kitchen-card))" }}>
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Cozinha - Pedidos</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Fila de Pedidos ({orders.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Mais antigo no topo, mais recente embaixo
          </p>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum pedido na fila
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className="transition-all hover:shadow-md"
                style={{ backgroundColor: "hsl(var(--kitchen-card))" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {order.menu_items?.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          Mesa {order.tables?.table_number}
                        </Badge>
                        <Badge variant="outline">
                          Qtd: {order.quantity}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant={order.status === "pending" ? "default" : "secondary"}
                    >
                      {order.status === "pending" ? "Novo" : "Preparando"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.observations && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-sm font-medium">Observações:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.observations}
                      </p>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>Garçom: {order.profiles?.full_name}</p>
                    <p>
                      Pedido às:{" "}
                      {new Date(order.created_at).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleCompleteOrder(order.id)}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Pedido Pronto
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}