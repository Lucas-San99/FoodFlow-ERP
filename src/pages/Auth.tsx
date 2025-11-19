import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { toast } from "sonner";
import logoAuth from "@/assets/logo_auth.png";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(128, "Senha muito longa"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await signIn(result.data.email, result.data.password);
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
           {" "}
      <Card className="w-full max-w-md shadow-xl">
                {/* ALTERAÇÃO: Removendo o space-y do CardHeader para gerenciar o espaçamento manualmente. */}       {" "}
        <CardHeader className="text-center">
                   {" "}
          <div className="mx-auto **mb-0**">
            {" "}
            {/* ADICIONADO: mb-0 para garantir que não há margem inferior na div do logo */}           {" "}
            {/* O logoAuth que você está usando parece ter um espaço transparente grande em volta do ícone central. */}
                        <img src={logoAuth} alt="FoodFlow ERP Logo" className="h-32.5 w-auto object-contain" />       
             {" "}
          </div>
                    {/* ALTERAÇÃO: Adicionada classe **-mt-4** (margin-top negativa) para puxar o texto para cima. */} 
                  <CardDescription className="text-base **-mt-4**">Faça login para acessar o sistema</CardDescription> 
               {" "}
        </CardHeader>
               {" "}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
