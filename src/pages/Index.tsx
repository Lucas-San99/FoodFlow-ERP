import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <UtensilsCrossed className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mb-4 text-4xl font-bold text-primary md:text-5xl">
        Sistema de Gestão de Mesas
      </h1>
      <p className="mb-8 max-w-md text-lg text-muted-foreground">
        Gerencie mesas, pedidos e cardápio de forma eficiente
      </p>
      <Button size="lg" onClick={() => navigate("/auth")}>
        Acessar Sistema
      </Button>
    </div>
  );
};

export default Index;
