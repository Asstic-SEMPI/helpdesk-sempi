import { NextResponse } from 'next/server';
import { processarChamadosPendentesValidacao } from '@/lib/services/rotinaValidacao';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secretParam = searchParams.get('secret');

    // Autenticação opcional por CRON_SECRET para segurança em produção
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` ||
        secretParam === cronSecret;

      if (!isAuthorized) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }

    const resultado = await processarChamadosPendentesValidacao();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      resultado,
    });
  } catch (error: any) {
    console.error('Erro na rota cron de validação:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
