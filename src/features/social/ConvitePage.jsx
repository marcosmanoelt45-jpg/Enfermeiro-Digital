import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { vibrate } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";
import { AvatarDe } from "./componentes.jsx";
import { codigoValido } from "./logicaSocial.js";
import { aceitarConvite, verConvite } from "./servicoSocial.js";

const EASE_OUT = [0.23, 1, 0.32, 1];

/**
 * Página do link de convite (/convite/CODIGO), aberta de fora (WhatsApp, Telegram...). Mostra quem convidou;
 * sem conta, leva para entrar/criar conta e volta aqui; com conta, aceita e vira amigo.
 */
export default function ConvitePage() {
  const { codigo = "" } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [convite, setConvite] = useState(undefined);
  const [estado, setEstado] = useState("pronto"); // pronto | aceitando | feito | erro
  const [erro, setErro] = useState(null);
  const valido = codigoValido(codigo);

  useEffect(() => {
    if (!valido) return setConvite(null);
    verConvite(codigo)
      .then(setConvite)
      .catch(() => setConvite(null));
  }, [codigo, valido]);

  const aceitar = async () => {
    setEstado("aceitando");
    try {
      const amigo = await aceitarConvite(codigo);
      setEstado("feito");
      vibrate(15);
      celebrate({ count: 60, y: 0.45 });
      setTimeout(() => navigate(`/perfil/${amigo}`), 1400);
    } catch (e) {
      setErro(e.message);
      setEstado("erro");
    }
  };

  const voltarAqui = `/convite/${codigo}`;
  const nome = convite?.nome?.split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B131D] px-6 text-center text-[#EAF2F8]">
      {convite === undefined ? (
        <p className="text-sm font-bold text-[#9FB3C6]">Abrindo o convite…</p>
      ) : !convite || !convite.valido ? (
        <div className="max-w-sm space-y-4">
          <h1 className="text-2xl font-black">Convite inválido</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">Esse link não existe mais ou expirou. Peça um link novo para quem te chamou.</p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate("/")}>
            Ir para o Enfere
          </Button>
        </div>
      ) : (
        <motion.div
          className="w-full max-w-sm space-y-5"
          initial={{ opacity: 0, transform: "translateY(10px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.3, ease: EASE_OUT } }}
        >
          <div className="mx-auto w-fit">
            <AvatarDe perfil={{ ...convite, user_id: codigo }} tamanho={140} />
          </div>
          <div>
            <h1 className="text-2xl font-black">{estado === "feito" ? `Você e ${nome} agora são amigos!` : `${nome} te chamou para estudar junto`}</h1>
            <p className="mt-2 text-sm font-semibold text-[#9FB3C6]">
              No Enfere vocês treinam enfermagem com casos, cálculos e técnicas, e acompanham a ofensiva um do outro.
            </p>
          </div>
          {erro && <p className="rounded-xl bg-[#FF6B6B]/12 p-3 text-sm font-bold text-[#FF6B6B]">{erro}</p>}
          {estado !== "feito" &&
            (isAuthenticated && user ? (
              <Button variant="primary" size="lg" className="w-full" onClick={aceitar} loading={estado === "aceitando"}>
                Aceitar convite
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="primary" size="lg" className="w-full" onClick={() => navigate(`/register?returnTo=${encodeURIComponent(voltarAqui)}`)}>
                  Criar minha conta
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(`/login?returnTo=${encodeURIComponent(voltarAqui)}`)}>
                  Já tenho conta
                </Button>
              </div>
            ))}
        </motion.div>
      )}
    </div>
  );
}
