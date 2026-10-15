import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail =
  process.env.SUPABASE_ADMIN_EMAIL || 'feedbackcompassrose@gmail.com'
const adminPassword = process.env.SUPABASE_ADMIN_PASSWORD
const adminName = process.env.SUPABASE_ADMIN_NAME || 'Administrador Global'

const missing = [
  ['SUPABASE_URL ou VITE_SUPABASE_URL', supabaseUrl],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ['SUPABASE_ADMIN_PASSWORD', adminPassword],
]
  .filter(([, value]) => !value)
  .map(([name]) => name)

if (missing.length > 0) {
  console.error(`Variáveis ausentes: ${missing.join(', ')}`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const userAttributes = {
  email: adminEmail,
  password: adminPassword,
  email_confirm: true,
  user_metadata: {
    nome: adminName,
    role: 'global_admin',
  },
}

const { data, error } = await supabase.auth.admin.createUser(userAttributes)

if (error && error.message !== 'A user with this email address has already been registered') {
  console.error(`Erro ao criar usuário administrador: ${error.message}`)
  process.exit(1)
}

let userId = data.user?.id

if (!userId) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error(`Erro ao localizar usuário administrador: ${listError.message}`)
    process.exit(1)
  }

  userId = users.users.find((user) => user.email === adminEmail)?.id
}

if (!userId) {
  console.error('Usuário administrador não foi encontrado após a criação.')
  process.exit(1)
}

const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
  password: adminPassword,
  email_confirm: true,
  user_metadata: {
    nome: adminName,
    role: 'global_admin',
  },
})

if (updateError) {
  console.error(`Erro ao atualizar usuário administrador: ${updateError.message}`)
  process.exit(1)
}

const { error: profileError } = await supabase
  .from('global_admin_profiles')
  .upsert({
    id: userId,
    email: adminEmail,
    nome: adminName,
    role: 'global_admin',
  })

if (profileError) {
  console.error(`Erro ao registrar perfil administrador: ${profileError.message}`)
  process.exit(1)
}

console.log('Administrador global configurado com sucesso.')
