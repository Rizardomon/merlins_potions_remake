import { redirect } from "next/navigation";

/** Raiz do app: entra direto na primeira tela. */
export default function Home() {
  redirect("/dashboard");
}
