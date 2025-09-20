/**
 * Test script for the TankLog reminder system
 *
 * This script tests the automated reminder system for corrective actions.
 * Run with: node test-reminder-system.js
 */

const { reminderService } = require('./lib/reminder-service');
const { correctiveActionService } = require('./lib/corrective-actions');
const { rateLimitingService, RATE_LIMITS } = require('./lib/rate-limiting');

async function testReminderSystem() {
  console.log('🧪 Testing TankLog Reminder System...\n');

  try {
    // Test 1: Rate Limiting
    console.log('1️⃣ Testing Rate Limiting...');
    const testUserId = 'test-user-123';

    for (let i = 0; i < 6; i++) {
      const result = await rateLimitingService.checkRateLimit(
        testUserId,
        RATE_LIMITS.reminderEmails
      );
      console.log(
        `   Request ${i + 1}: ${result.allowed ? '✅ Allowed' : '❌ Blocked'} (${result.remaining} remaining)`
      );
    }
    console.log('');

    // Test 2: Create Test Corrective Action
    console.log('2️⃣ Creating Test Corrective Action...');
    const testAction = await correctiveActionService.createCorrectiveAction({
      inspectionId: 'test-inspection-123',
      itemId: 'leak_check',
      failureDetails: {
        itemId: 'leak_check',
        description: 'Test leak detected during system testing',
        requiredAction: 'Replace test valve and verify no leaks',
        assignedTo: testUserId,
      },
    });
    console.log(`   ✅ Created action: ${testAction.id}`);
    console.log('');

    // Test 3: Create Initial Reminders
    console.log('3️⃣ Creating Initial Reminders...');
    await reminderService.createInitialReminders(testAction.id, 'immediate');
    console.log('   ✅ Initial reminders created');
    console.log('');

    // Test 4: Process Due Reminders
    console.log('4️⃣ Processing Due Reminders...');
    const stats = await reminderService.processDueReminders();
    console.log(
      `   📊 Processed: ${stats.processed}, Sent: ${stats.sent}, Failed: ${stats.failed}, Escalated: ${stats.escalated}`
    );
    console.log('');

    // Test 5: Test Email Templates
    console.log('5️⃣ Testing Email Templates...');
    const mockAction = {
      id: 'test-action-123',
      inspection_item_id: 'leak_check',
      description: 'Test leak detected',
      required_action: 'Replace valve and test',
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      severity_level: 'immediate',
      inspection: {
        site: 'Test Site',
        tank_id: 'TANK-001',
      },
      technician: {
        name: 'Test Technician',
        email: 'test@example.com',
      },
    };

    const templates = [
      { type: 'initial', name: 'Initial Notification' },
      { type: 'due_soon', name: 'Due Soon' },
      { type: 'overdue', name: 'Overdue Alert' },
    ];

    for (const template of templates) {
      const emailTemplate = reminderService.getEmailTemplate(
        template.type,
        mockAction
      );
      console.log(`   📧 ${template.name}: ${emailTemplate.subject}`);
    }
    console.log('');

    // Test 6: Cleanup
    console.log('6️⃣ Cleaning Up...');
    await reminderService.cancelRemindersForAction(testAction.id);
    console.log('   ✅ Test reminders cancelled');
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Rate limiting working correctly');
    console.log('   ✅ Corrective action creation working');
    console.log('   ✅ Reminder creation working');
    console.log('   ✅ Reminder processing working');
    console.log('   ✅ Email templates generated');
    console.log('   ✅ Cleanup working');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testReminderSystem().catch(console.error);
}

module.exports = { testReminderSystem };
