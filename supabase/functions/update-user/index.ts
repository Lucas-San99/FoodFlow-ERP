import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateUserRequest {
  userId: string;
  fullName: string;
  role: 'admin' | 'waiter' | 'kitchen';
  unitId?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Verify the JWT and get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Token inválido');
    }

    // Check if the requesting user is an admin
    const { data: adminRoleData, error: adminRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminRoleError || adminRoleData?.role !== 'admin') {
      throw new Error('Apenas administradores podem atualizar usuários');
    }

    const { userId, fullName, role, unitId }: UpdateUserRequest = await req.json();

    console.log('Updating user:', { userId, fullName, role, unitId });

    // Update the user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: fullName,
        unit_id: unitId || null
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    }

    // Update the user's role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ 
        role,
        unit_id: unitId || null
      })
      .eq('user_id', userId);

    if (roleError) {
      console.error('Error updating role:', roleError);
      throw new Error(`Erro ao atualizar função: ${roleError.message}`);
    }

    console.log('User updated successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in update-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
