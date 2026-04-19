import { Resend } from 'resend';

const resend = new Resend('re_PP2fBBr3_EkEufs3LrofXoxMD9WomNjYu');

function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background-color:#111827;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">GymXam</h1>
          <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Fitness &amp; Training</p>
        </td></tr>
        <tr><td style="background-color:#fff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          ${content}
        </td></tr>
        <tr><td style="background-color:#111827;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:12px;">© 2026 GymXam. All rights reserved.</p>
          <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">Questions? <a href="mailto:info@auditmylanding.com" style="color:#9ca3af;text-decoration:none;">info@auditmylanding.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function infoBox(rows) {
  return '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:24px 0;">' +
    rows.map((r, i) =>
      `<tr>
        <td style="padding:12px 20px;font-size:14px;color:#6b7280;font-weight:600;border-bottom:${i < rows.length - 1 ? '1px solid #e5e7eb' : 'none'};width:40%;">${r.label}</td>
        <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:500;border-bottom:${i < rows.length - 1 ? '1px solid #e5e7eb' : 'none'};">${r.value}</td>
      </tr>`
    ).join('') + '</table>';
}

function badge(text, color) {
  const bg = { '#16a34a': '#dcfce7', '#dc2626': '#fee2e2', '#d97706': '#fef3c7', '#2563eb': '#dbeafe' };
  return `<span style="display:inline-block;background-color:${bg[color]};color:${color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`;
}

const sig = '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/><p style="margin:0;color:#6b7280;font-size:14px;">Best regards,<br/><strong style="color:#111827;">The GymXam Team</strong></p>';
const p = t => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${t}</p>`;
const h = t => `<h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">${t}</h2>`;
const g = n => `<p style="margin:0 0 20px;color:#374151;font-size:15px;">Hi <strong>${n}</strong>,</p>`;

const emails = [
  {
    subject: '1/8 — Booking Confirmed — CrossFit Morning',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('Booking Confirmed', '#16a34a')}</div>
      ${h('Your class is booked!')}
      ${g('Enea')}
      ${p('Great news — your spot has been reserved. See you on the mat!')}
      ${infoBox([{ label: 'Class', value: 'CrossFit Morning' }, { label: 'Date', value: 'Monday, April 21, 2026' }, { label: 'Time', value: '09:00 AM' }, { label: 'Credits Remaining', value: '5' }])}
      ${p('You can cancel your booking up to <strong>8 hours</strong> before the class starts.')}
      ${sig}
    `)
  },
  {
    subject: '2/8 — Booking Cancelled (by you)',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('Booking Cancelled', '#dc2626')}</div>
      ${h('Your booking has been cancelled')}
      ${g('Enea')}
      ${p('Your booking has been successfully cancelled and a class credit has been returned to your account.')}
      ${infoBox([{ label: 'Class', value: 'CrossFit Morning' }, { label: 'Date', value: 'Monday, April 21, 2026' }, { label: 'Time', value: '09:00 AM' }])}
      ${p('We hope to see you at a future class!')}
      ${sig}
    `)
  },
  {
    subject: '3/8 — Booking Cancelled (by admin)',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('Booking Cancelled', '#dc2626')}</div>
      ${h('Your booking has been cancelled')}
      ${g('Enea')}
      ${p('Your booking has been successfully cancelled and a class credit has been returned to your account.')}
      ${infoBox([{ label: 'Class', value: 'CrossFit Morning' }, { label: 'Date', value: 'Monday, April 21, 2026' }, { label: 'Time', value: '09:00 AM' }])}
      ${p('We hope to see you at a future class!')}
      ${sig}
    `)
  },
  {
    subject: '4/8 — Class Cancelled by Admin',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('Class Cancelled', '#dc2626')}</div>
      ${h('A class has been cancelled')}
      ${g('Enea')}
      ${p('We regret to inform you that the following class has been cancelled. Your class credit has been automatically returned to your account.')}
      ${infoBox([{ label: 'Class', value: 'CrossFit Morning' }, { label: 'Date', value: 'Monday, April 21, 2026' }])}
      ${p('We apologise for the inconvenience. Please check the schedule for other available classes.')}
      ${sig}
    `)
  },
  {
    subject: '5/8 — Membership Expires in 2 Days (auto)',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('Action Required', '#d97706')}</div>
      ${h('Your membership is expiring soon')}
      ${g('Enea')}
      ${p('Your membership package expires in <strong>2 days</strong>. Renew now to keep your spot in class without interruption.')}
      ${infoBox([{ label: 'Package', value: '8 CrossFit Classes / Month' }, { label: 'Credits Remaining', value: '2' }, { label: 'Days Remaining', value: '2' }, { label: 'Expires On', value: 'April 19, 2026' }])}
      ${p('Contact us or visit the gym to renew your membership before it expires.')}
      ${sig}
    `)
  },
  {
    subject: '6/8 — Membership Expiring Soon (manual remind)',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('Action Required', '#d97706')}</div>
      ${h('Your membership is expiring soon')}
      ${g('Enea')}
      ${p('Your membership package expires in <strong>5 days</strong>. Renew now to keep your spot in class without interruption.')}
      ${infoBox([{ label: 'Package', value: '8 CrossFit Classes / Month' }, { label: 'Credits Remaining', value: '3' }, { label: 'Days Remaining', value: '5' }, { label: 'Expires On', value: 'April 22, 2026' }])}
      ${p('Contact us or visit the gym to renew your membership before it expires.')}
      ${sig}
    `)
  },
  {
    subject: '7/8 — Account Approved',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('Welcome', '#16a34a')}</div>
      ${h('Your account has been approved!')}
      ${g('Enea')}
      ${p('Welcome to GymXam! Your account is now active and you can start booking fitness classes.')}
      ${p('Log in to your account to browse the schedule and book your first class. We look forward to training with you!')}
      ${sig}
    `)
  },
  {
    subject: '8/8 — New Membership Package Assigned',
    html: layout(`
      <div style="margin-bottom:24px;">${badge('New Package', '#2563eb')}</div>
      ${h('Your membership package is ready')}
      ${g('Enea')}
      ${p('A new membership package has been assigned to your account. You can start booking classes right away!')}
      ${infoBox([{ label: 'Package', value: 'Basic Package: 8 Classes' }, { label: 'Total Classes', value: '8' }, { label: 'Valid Until', value: 'May 17, 2026' }])}
      ${p('Log in to your account to browse the class schedule and book your first session.')}
      ${sig}
    `)
  }
];

for (const email of emails) {
  const r = await resend.emails.send({ from: 'info@auditmylanding.com', to: 'eneamuja87@gmail.com', subject: email.subject, html: email.html });
  console.log(email.subject, '->', r.error ? JSON.stringify(r.error) : r.data.id);
  await new Promise(res => setTimeout(res, 400));
}
