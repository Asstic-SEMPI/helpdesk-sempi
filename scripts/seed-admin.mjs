import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis do Supabase não encontradas no ambiente');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = 'ti.asstic@gmail.com';
  const password = process.env.GMAIL_APP_PASSWORD || 'SEVIT1501';
  const nome = 'Administrador TI';
  const cargo = 'Gestor de TI';
  const role = 'ADMIN';

  console.log(`Verificando/Criando usuário admin: ${email}...`);

  // 1. Verificar se usuário já existe no Auth
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find((u) => u.email === email);
  let userId;

  if (existingUser) {
    console.log(`Usuário já existe no Auth (ID: ${existingUser.id}). Atualizando senha e metadados...`);
    userId = existingUser.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { nome, cargo, role },
      email_confirm: true,
    });
    if (updateError) {
      console.error('Erro ao atualizar usuário existente:', updateError.message);
    }
  } else {
    console.log('Criando novo usuário via Auth Admin...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, cargo, role },
    });

    if (createError) {
      console.error('Erro ao criar usuário:', createError.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`Usuário criado com sucesso no Auth! (ID: ${userId})`);
  }

  // 2. Garantir registro na tabela profiles
  console.log('Sincronizando perfil na tabela public.profiles...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email,
      nome,
      cargo,
      role,
      is_active: true,
    });

  if (profileError) {
    console.error('Erro ao registrar na tabela profiles:', profileError.message);
  } else {
    console.log('Perfil sincronizado com sucesso na tabela profiles!');
  }

  console.log('\n=======================================');
  console.log('✅ USUÁRIO ADMINISTRADOR PRONTO PARA LOGIN:');
  console.log(`E-mail: ${email}`);
  console.log(`Senha: ${password}`);
  console.log(`URL de Login: http://localhost:3000/admin/login`);
  console.log('=======================================\n');
}

main();
