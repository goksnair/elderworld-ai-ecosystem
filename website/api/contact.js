// Vercel Serverless Function for Contact Form
// Integration with Supabase for lead capture

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Enable CORS for website
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    })
  }

  try {
    const { name, email, phone, location, message, careNeeds } = req.body

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'phone', 'message']
      })
    }

    // Insert lead into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          phone,
          location: location || 'Bangalore',
          message,
          care_needs: careNeeds,
          source: 'website_contact_form',
          status: 'new',
          priority: careNeeds && careNeeds.includes('emergency') ? 'high' : 'normal',
          created_at: new Date().toISOString()
        }
      ])

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // TODO: Send notification email to operations team
    // TODO: Trigger SMS to care coordinator if urgent
    // TODO: Add to CRM/follow-up system

    return res.status(200).json({ 
      success: true,
      message: 'Thank you for contacting ElderWorld. Our care coordinator will contact you within 24 hours.',
      leadId: data?.[0]?.id,
      nextSteps: [
        'Care coordinator will call within 24 hours',
        'Family consultation scheduled if interested', 
        'Custom care plan created based on needs',
        'Caregiver matching and introduction'
      ]
    })

  } catch (error) {
    console.error('Contact form error:', error)
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to process contact form',
      message: 'Please try again or call us directly at +91-80-1234-5678',
      supportEmail: 'contact@elderworld.co'
    })
  }
}