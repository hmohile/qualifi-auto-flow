
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput, userData, sessionId } = await req.json();
    
    console.log('Received request:', { userInput, userData, sessionId });
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create or get existing session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert([{ user_data: userData }])
        .select()
        .single();
      
      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw sessionError;
      }
      
      currentSessionId = session.id;
    }
    
    // Store user message in database
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: currentSessionId,
        message_type: 'user',
        content: userInput
      }]);
    
    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
    }
    
    // Create system prompt with user context
    const systemPrompt = `You are a friendly auto loan assistant helping users with queries about buying a car. 
    
User Context:
- Car: ${userData.carMakeModel || 'Not specified'}
- Budget: ${userData.totalBudget || 'Not specified'}
- Down Payment: ${userData.downPayment || 'Not specified'}
- Income: ${userData.annualIncome || 'Not specified'}
- Credit Score: ${userData.creditScore || 'Not specified'}

Be enthusiastic, helpful, and use appropriate emojis. Provide specific information based on their context when possible.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.8,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;
    
    // Store assistant response in database
    const { error: botMessageError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: currentSessionId,
        message_type: 'bot',
        content: assistantResponse,
        user_input: userInput
      }]);
    
    if (botMessageError) {
      console.error('Error storing bot message:', botMessageError);
    }
    
    return new Response(JSON.stringify({ 
      response: assistantResponse,
      sessionId: currentSessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in openai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while processing your request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
