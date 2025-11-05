import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  fullName: string
  role: 'waiter' | 'kitchen' | 'admin'
  unitId?: string | null
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify that the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Não autorizado')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Apenas administradores podem criar usuários')
    }

    // Parse request body
    const { email, password, fullName, role, unitId }: CreateUserRequest = await req.json()

    console.log(`Criando usuário: ${email} com role ${role} e unidade ${unitId}`)

    // Create the user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    })

    if (createError) {
      console.error('Erro ao criar usuário:', createError)
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Usuário não foi criado')
    }

    console.log(`Usuário criado com ID: ${newUser.user.id}`)

    // Update profile with unit_id
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ unit_id: unitId || null })
      .eq('id', newUser.user.id)

    if (profileUpdateError) {
      console.error('Erro ao atualizar perfil com unit_id:', profileUpdateError)
      // Try to delete the user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw new Error('Erro ao atualizar unidade do perfil')
    }

    // Assign the role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
        unit_id: unitId || null
      })

    if (roleInsertError) {
      console.error('Erro ao atribuir role:', roleInsertError)
      // Try to delete the user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw new Error('Erro ao atribuir função ao usuário')
    }

    console.log(`Role ${role} e unidade atribuídos ao usuário ${newUser.user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        user: newUser.user
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erro na função create-user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})