import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";

export function SalesReport() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    count: number;
  } | null>(null);

  const handleProcess = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha ambas as datas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from("tables")
        .select("total_amount")
        .eq("status", "closed")
        .gte("closed_at", startDate)
        .lte("closed_at", endDate);

      if (error) throw error;

      const total = data.reduce((acc, table) => acc + (table.total_amount || 0), 0);
      const count = data.length;

      setResult({ total, count });

      toast({
        title: "Relatório gerado",
        description: "Os dados foram processados com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Falha ao processar o relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar Relatório de Vendas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Relatório de Vendas</DialogTitle>
          <DialogDescription>
            Selecione o período para gerar o relatório financeiro
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="start-date">Data Início</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="end-date">Data Fim</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Button
            onClick={handleProcess}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Processar"
            )}
          </Button>

          {result && (
            <div className="mt-4 rounded-lg border border-border bg-muted p-4">
              <h3 className="font-semibold text-lg mb-3">Resultado do Período</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de Vendas:</span>
                  <span className="font-bold text-xl text-primary">
                    {formatCurrency(result.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Quantidade de Mesas:</span>
                  <span className="font-semibold text-lg">
                    {result.count}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
