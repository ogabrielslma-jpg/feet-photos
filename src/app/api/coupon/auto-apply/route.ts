import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(_req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    // 1) Se ja existe cupom ativo NAO expirado, retorna ele
    const { data: existing } = await supabase
      .from("coupons")
      .select("id, discount_pct, expires_at, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log(`[AutoCoupon] Reutilizando cupom existente ${existing.id}`);
      return NextResponse.json({ success: true, coupon: existing, reused: true });
    }

    // 2) Cria novo cupom de 47% valido por 5 minutos
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data: created, error: insErr } = await supabase
      .from("coupons")
      .insert({
        user_id: user.id,
        discount_pct: 47,
        status: "active",
        expires_at: expires,
      })
      .select("id, discount_pct, expires_at, status")
      .single();

    if (insErr || !created) {
      console.error("[AutoCoupon] Erro ao criar cupom:", insErr);
      return NextResponse.json({ error: "Erro ao criar cupom: " + (insErr?.message || "desconhecido") }, { status: 500 });
    }

    console.log(`[AutoCoupon] Cupom criado ${created.id} (47% - 5min)`);
    return NextResponse.json({ success: true, coupon: created, reused: false });
  } catch (e: any) {
    console.error("[AutoCoupon] Erro:", e);
    return NextResponse.json({ error: e?.message || "Erro inesperado" }, { status: 500 });
  }
}
