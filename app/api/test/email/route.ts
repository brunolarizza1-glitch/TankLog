import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/postmark';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Testing email to:', email);

    const result = await sendEmail({
      to: email,
      subject: 'TankLog Test Email',
      htmlBody: `
        <h1>Test Email from TankLog</h1>
        <p>This is a test email to verify that Postmark is working correctly.</p>
        <p>If you receive this email, the email functionality is working!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      textBody: `
        Test Email from TankLog
        
        This is a test email to verify that Postmark is working correctly.
        
        If you receive this email, the email functionality is working!
        
        Sent at: ${new Date().toISOString()}
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    );
  }
}
