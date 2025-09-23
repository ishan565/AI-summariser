import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file) {
      return NextResponse.json({ error: 'No file found in request.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const pdfData = await pdf(buffer);
    const text = pdfData.text.trim();

    if (!text) {
      return NextResponse.json({ error: 'Could not extract text from PDF.' }, { status: 400 });
    }

    const truncatedText = text.substring(0, 12000);

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // FIX: Switched to the latest Llama 3.1 model for best compatibility
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic assistant. Your task is to create a high-quality, well-structured summary of the provided text for a student preparing for an exam. Focus on key concepts, definitions, and important arguments.'
          },
          {
            role: 'user',
            content: `Please generate a comprehensive study summary for the following document:\n\n${truncatedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    // If the API call fails, send back the specific error from Groq
    if (!groqResponse.ok) {
      const errorBody = await groqResponse.json();
      console.error("--- GROQ API ERROR ---", errorBody);
      // Pass the specific error message from Groq to the frontend
      return NextResponse.json({ error: errorBody.error.message || 'Failed to get summary from AI service.' }, { status: groqResponse.status });
    }

    const groqData = await groqResponse.json();
    const summary = groqData.choices[0].message.content;

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('--- UNEXPECTED ERROR IN API ROUTE ---', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}