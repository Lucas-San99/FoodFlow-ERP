import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Kitchen {
  id: string;
  full_name: string;
  unit_id: string | null;
}

interface Unit {
  id: string;
  name: string;
}

interface KitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kitchen: Kitchen | null;
  onSuccess: () => void;
}

export function KitchenDialog({ open, onOpenChange, kitchen, onSuccess }: KitchenDialogProps) {
  const [identifier, setIdentifier] = useState("");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUnits();
      if (kitchen) {
        // Extract identifier from full_name (format: KITCHEN-{identifier})
        const id = kitchen.full_name.replace("KITCHEN-", "");
        setIdentifier(id);
        setUnitId(kitchen.unit_id || "");
      } else {
        setIdentifier("");
        setUnitId("");
      }
    }
  }, [open, kitchen]);

  const loadUnits = async () => {
    const { data } = await supabase.from("units").select("id, name");
    if (data) setUnits(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!identifier || !unitId) {
        toast.error("Preencha todos os campos");
        return;
      }

      // Validate identifier is numeric
      if (!/^\d+$/.test(identifier)) {
        toast.error("O identificador deve conter apenas números");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const endpoint = kitchen
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-kitchen`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-kitchen`;

      const payload = kitchen
        ? { user_id: kitchen.id, identifier, unit_id: unitId, full_name: `KITCHEN-${identifier}` }
        : { identifier, full_name: `KITCHEN-${identifier}`, unit_id: unitId };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar cozinha");
      }

      toast.success(kitchen ? "Cozinha atualizada" : "Cozinha criada");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kitchen ? "Editar Cozinha" : "Nova Cozinha"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifier">Identificador (senha numérica)</Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ex: 1234"
              required
            />
          </div>
          <div>
            <Label htmlFor="unit">Unidade</Label>
            <Select value={unitId} onValueChange={setUnitId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
