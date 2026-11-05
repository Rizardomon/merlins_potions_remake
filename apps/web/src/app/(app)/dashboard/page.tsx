import { Card, CardBody } from "@/components/ui/card";

/**
 * Dashboard — intencionalmente mínima.
 *
 * É o ponto de partida do seu projeto: substitua por KPIs, gráficos e listas reais.
 * O CRUD de Papéis (`/roles`) é o exemplo completo de uma tela ligada a dados.
 */
export default function DashboardPage() {
  return (
    <Card>
      <CardBody className="py-16 text-center text-content-2">
        Ponto de partida do projeto — construa os widgets da dashboard aqui.
      </CardBody>
    </Card>
  );
}
