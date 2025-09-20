# TankLog Automated Reminder System

## Overview

The TankLog automated reminder system provides comprehensive email notifications for corrective actions based on severity levels and due dates. The system includes rate limiting, escalation management, and unsubscribe functionality.

## 🏗️ Architecture

### Core Components

1. **ReminderService** (`lib/reminder-service.ts`)
   - Main service for managing reminders
   - Handles reminder creation, scheduling, and sending
   - Manages escalation logic for overdue actions

2. **RateLimitingService** (`lib/rate-limiting.ts`)
   - Prevents email spam and API abuse
   - Configurable rate limits for different operations
   - Automatic cleanup of expired records

3. **API Endpoints**
   - `/api/reminders/process` - Cron job endpoint
   - `/api/reminders/unsubscribe` - Unsubscribe functionality

4. **Database Tables**
   - `follow_up_reminders` - Reminder scheduling and status
   - `rate_limits` - Rate limiting data

## 📧 Email Templates

### Template Types

1. **Initial Notification**
   - Sent when corrective action is created
   - Includes action details, due date, and required actions
   - Professional blue theme

2. **Due Soon Reminders**
   - Sent based on severity level timing
   - Color-coded urgency (red for immediate, yellow for 24hr, blue for 7day)
   - Shows hours remaining until due

3. **Overdue Alerts**
   - Sent when actions pass their due date
   - Red urgent theme with clear overdue messaging
   - Emphasizes immediate attention required

4. **Management Escalation**
   - Sent to management when 3+ actions are overdue
   - Summary of all overdue actions
   - Requires immediate organizational attention

### Template Features

- **Responsive Design**: Works on desktop and mobile
- **Unsubscribe Links**: Every email includes unsubscribe functionality
- **Action Links**: Direct links to corrective actions dashboard
- **Rich Content**: HTML and plain text versions
- **Branding**: Consistent with TankLog design system

## ⏰ Reminder Scheduling

### Severity-Based Scheduling

#### Immediate (4 hours)

- **Initial**: Sent immediately when action is created
- **2 hours before due**: "Due Soon" reminder
- **1 hour before due**: "Due Soon" reminder
- **Past due**: "Overdue" alert

#### 24hr (24 hours)

- **Initial**: Sent immediately when action is created
- **12 hours before due**: "Due Soon" reminder
- **2 hours before due**: "Due Soon" reminder
- **Past due**: "Overdue" alert

#### 7day (7 days)

- **Initial**: Sent immediately when action is created
- **3.5 days before due**: "Due Soon" reminder
- **1.75 days before due**: "Due Soon" reminder
- **17 hours before due**: "Due Soon" reminder
- **Past due**: "Overdue" alert

### Escalation Logic

- **Trigger**: 3 or more overdue actions in the same organization
- **Recipients**: Organization admins and owners
- **Frequency**: Once per escalation (not repeated)
- **Content**: Summary of all overdue actions

## 🚦 Rate Limiting

### Rate Limits

1. **Reminder Emails**: 5 per hour per user
2. **API Calls**: 100 per hour per user
3. **Unsubscribe Requests**: 10 per hour per IP

### Rate Limit Features

- **Sliding Window**: 1-hour windows for all limits
- **Automatic Cleanup**: Expired records cleaned up daily
- **Graceful Degradation**: System continues working if rate limiting fails
- **Detailed Logging**: All rate limit events are logged

## 🔧 Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET_TOKEN=your-secret-token

# Email (existing)
POSTMARK_API_TOKEN=your-postmark-token
```

### Cron Job Setup

#### Vercel (Recommended)

```json
{
  "crons": [
    {
      "path": "/api/reminders/process",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Manual Cron

```bash
# Run every hour
0 * * * * curl -X POST https://your-app.vercel.app/api/reminders/process \
  -H "Authorization: Bearer your-secret-token"
```

#### GitHub Actions

```yaml
name: Process Reminders
on:
  schedule:
    - cron: '0 * * * *' # Every hour
jobs:
  process-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reminder API
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/reminders/process \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}"
```

## 📊 Monitoring & Analytics

### Logging

All reminder operations are logged with:

- Timestamp
- Action ID
- Recipient
- Reminder type
- Success/failure status
- Rate limit information

### Metrics

The system tracks:

- **Processed**: Total reminders processed
- **Sent**: Successfully sent emails
- **Failed**: Failed email deliveries
- **Escalated**: Management escalations created

### Health Checks

- **GET /api/reminders/process**: Basic health check
- **Rate limit status**: Available via API
- **Database connectivity**: Checked during processing

## 🧪 Testing

### Test Script

Run the comprehensive test suite:

```bash
node test-reminder-system.js
```

### Manual Testing

1. **Create Test Action**:

   ```typescript
   const action = await correctiveActionService.createCorrectiveAction({
     inspectionId: 'test-123',
     itemId: 'leak_check',
     failureDetails: {
       itemId: 'leak_check',
       description: 'Test leak',
       requiredAction: 'Fix test leak',
       assignedTo: 'test-user',
     },
   });
   ```

2. **Process Reminders**:

   ```bash
   curl -X POST https://your-app.vercel.app/api/reminders/process \
     -H "Authorization: Bearer your-secret-token"
   ```

3. **Check Rate Limits**:
   ```typescript
   const status = await rateLimitingService.getRateLimitStatus(
     'user-123',
     RATE_LIMITS.reminderEmails
   );
   ```

## 🔒 Security

### Authentication

- **Cron Endpoint**: Protected with secret token
- **Unsubscribe**: Token-based (action ID)
- **Rate Limiting**: Prevents abuse

### Data Protection

- **Email Addresses**: Only used for legitimate notifications
- **Unsubscribe**: Immediate and permanent
- **Rate Limiting**: Prevents spam and abuse

### Privacy

- **No Tracking**: No user behavior tracking
- **Minimal Data**: Only necessary data stored
- **Automatic Cleanup**: Old data automatically removed

## 🚀 Deployment

### Prerequisites

1. Database migrations applied:
   - `007_failed_inspection_tracking.sql`
   - `008_rate_limiting.sql`

2. Environment variables configured

3. Email service (Postmark) configured

### Deployment Steps

1. **Deploy Code**: Push to production
2. **Run Migrations**: Apply database changes
3. **Configure Cron**: Set up automated processing
4. **Test System**: Run test suite
5. **Monitor**: Watch logs and metrics

### Rollback Plan

1. **Disable Cron**: Stop automated processing
2. **Revert Code**: Deploy previous version
3. **Clean Data**: Remove test data if needed
4. **Re-enable**: Restart cron when ready

## 📈 Performance

### Optimization

- **Batch Processing**: Process multiple reminders efficiently
- **Database Indexes**: Optimized queries for speed
- **Rate Limiting**: Prevents system overload
- **Error Handling**: Graceful failure handling

### Scalability

- **Horizontal Scaling**: Multiple instances supported
- **Database Optimization**: Efficient queries and indexes
- **Rate Limiting**: Prevents resource exhaustion
- **Monitoring**: Track performance metrics

## 🛠️ Troubleshooting

### Common Issues

1. **Reminders Not Sending**
   - Check email service configuration
   - Verify rate limiting status
   - Check database connectivity

2. **Rate Limiting Too Strict**
   - Adjust rate limit configurations
   - Check for legitimate high usage
   - Review rate limit logs

3. **Cron Job Not Running**
   - Verify cron configuration
   - Check authentication token
   - Review server logs

### Debug Commands

```bash
# Check reminder status
curl -X GET https://your-app.vercel.app/api/reminders/process

# Test rate limiting
node -e "
const { rateLimitingService, RATE_LIMITS } = require('./lib/rate-limiting');
rateLimitingService.getRateLimitStatus('test-user', RATE_LIMITS.reminderEmails)
  .then(console.log);
"

# Check database
psql -d your-db -c "SELECT COUNT(*) FROM follow_up_reminders WHERE status = 'pending';"
```

## 📚 API Reference

### POST /api/reminders/process

Process all due reminders.

**Headers:**

- `Authorization: Bearer <token>` (optional)

**Response:**

```json
{
  "success": true,
  "message": "Reminder processing completed",
  "stats": {
    "processed": 10,
    "sent": 8,
    "failed": 2,
    "escalated": 1
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/reminders/unsubscribe?token=<action_id>

Unsubscribe from reminders for a specific action.

**Response:** HTML page confirming unsubscribe

## 🎯 Future Enhancements

### Planned Features

1. **SMS Notifications**: Add SMS support for urgent actions
2. **Push Notifications**: Mobile app notifications
3. **Custom Schedules**: User-configurable reminder timing
4. **Advanced Analytics**: Detailed reporting and insights
5. **Integration APIs**: Connect with external systems

### Configuration Options

1. **Template Customization**: Organization-specific email templates
2. **Escalation Rules**: Customizable escalation triggers
3. **Notification Preferences**: User-level notification settings
4. **Multi-language**: Support for multiple languages

---

The TankLog automated reminder system provides a robust, scalable solution for managing corrective action notifications with comprehensive monitoring, security, and user experience features.
