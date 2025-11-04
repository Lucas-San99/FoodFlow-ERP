import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Receipt } from "lucide-react";

export default function Bill() {
  const { tableId } = useParams();
  const [table, setTable] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBillData();
  }, [tableId]);

  const loadBillData = async () => {
    if (!tableId) return;

    // Load table data
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select("*")
      .eq("id", tableId)
      .single();

    if (tableError) {
      toast.error("Erro ao carregar dados da conta");
      return;
    }

    setTable(tableData);

    // Load orders
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        menu_items (name, price)
      `)
      .eq("table_id", tableId);

    if (ordersError) {
      toast.error("Erro ao carregar pedidos");
      return;
    }

    setOrders(ordersData || []);
  };

  const handleConsentSubmit = async (consent: boolean) => {
    setLoading(true);

    try {
      const { error } = await supabase.from("consent_log").insert({
        table_id: tableId,
        phone: phone || null,
        consent_given: consent,
      });

      if (error) throw error;

      setConsentGiven(consent);
      toast.success("Preferências registradas!");
    } catch (error: any) {
      toast.error("Erro ao registrar preferências");
    } finally {
      setLoading(false);
    }
  };

  if (!table) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (consentGiven !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Receipt className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Obrigado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Suas preferências foram registradas com sucesso.
            </p>
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-lg font-bold text-primary">
                Dirija-se ao caixa para efetuar o pagamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Receipt className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Conta Digital</CardTitle>
            <p className="text-muted-foreground">
              Mesa {table.table_number} - {table.client_name}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">Itens Consumidos</h3>
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div>
                      <p className="font-medium">{order.menu_items?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {order.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      R$ {(order.item_price * order.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">
                  R$ {(table.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Deseja receber promoções?</h3>
              <p className="text-sm text-muted-foreground">
                Gostaríamos de enviar ofertas especiais e novidades via telefone.
              </p>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleConsentSubmit(false)}
                  disabled={loading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Não, obrigado
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleConsentSubmit(true)}
                  disabled={loading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sim, aceito
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}