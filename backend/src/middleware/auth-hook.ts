import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for JWT verification
// You'll need to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please add to backend/.env:');
  console.error('  SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('');
  console.error('Get these from: Supabase Dashboard → Settings → API');
  console.error('⚠️  Service Role Key is secret - never expose it publicly!');
  process.exit(1);
}

// Use service role key for backend operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Fastify preHandler hook that validates Supabase JWT tokens
 * and attaches user info to request.user
 */
export async function authHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    // Attach user to request object
    // Extend FastifyRequest type to include user (see type declaration below)
    (request as any).user = {
      id: user.id,
      email: user.email,
    };
  } catch (err) {
    return reply.code(401).send({
      error: 'UNAUTHORIZED',
      message: 'Authentication failed',
    });
  }
}
