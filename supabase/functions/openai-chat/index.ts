
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

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured. Please check your environment variables.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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
    
    // Create system prompt with user context and loan matching context
    const systemPrompt = `You are a friendly and knowledgeable auto loan assistant helping users with queries about buying a car and finding the best loan options. 

User Context:
- Car: ${userData.carMakeModel || 'Not specified'}
- Budget: ${userData.totalBudget || 'Not specified'}
- Down Payment: ${userData.downPayment || 'Not specified'}
- Income: ${userData.annualIncome || 'Not specified'}
- Credit Score: ${userData.creditScore || 'Not specified'}

You have access to loan matching algorithms and can provide specific recommendations based on their profile. When users ask about loan comparisons, eligibility, rates, or recommendations, provide detailed analysis based on their financial profile.

Be enthusiastic, helpful, and use appropriate emojis. Provide specific, actionable advice and calculations when possible. If they ask about loan options, explain how their credit score and income affect their eligibility and rates.`;

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
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      let errorMessage = 'Unknown error occurred';
      if (errorData.error?.code === 'insufficient_quota') {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(`OpenAI API error: ${errorMessage}`);
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
