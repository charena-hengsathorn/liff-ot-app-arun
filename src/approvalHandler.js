// Approval Handler - Phase 2 Implementation
// This file contains the approval logic that will be implemented in the next phase

/*
// LINE Webhook endpoint for handling group chat responses
export const handleWebhook = async (req, res) => {
  const events = req.body.events || [];
  
  // Debug: Log all incoming webhook data
  console.log('=== WEBHOOK DEBUG ===');
  console.log('Full webhook body:', JSON.stringify(req.body, null, 2));
  
  for (const event of events) {
    console.log('Processing event:', JSON.stringify(event, null, 2));
    
    if (event.source && event.source.type === 'group') {
      console.log('🎯 GROUP ID FOUND:', event.source.groupId);
      console.log('👤 USER ID:', event.source.userId);
      console.log('📝 MESSAGE:', event.message?.text || 'No text message');
    }
    
    if (
      event.type === 'message' &&
      event.message.type === 'text' &&
      event.source.type === 'group'
    ) {
      // Determine env by groupId
      const groupId = event.source.groupId;
      const env = (groupId === LINE_GROUP_ID_DEV) ? 'dev' : 'prod';

      const MANAGER_USER_IDS = getManagerUserIds(env);

      if (MANAGER_USER_IDS.includes(event.source.userId)) {
        const text = event.message.text.trim();
        
        // Only process if message starts with Approve or Deny (case-insensitive)
        if (/^(Approve|Deny)\b/i.test(text)) {
          const match = text.match(/^Approve\s+([^\s,]+)$/i);
          if (match) {
            const submittedAt = match[1];
            console.log('Sending updateApproval for submittedAt:', submittedAt);
            
            try {
              const result = await handleGoogleSheetsRequest({
                action: 'updateApproval',
                env,
                submittedAt,
                approval: 'Approve',
              });
              console.log('updateApproval result:', result);

              if (result.success) {
                // Fetch the row data and re-trigger submission
                const rowData = await handleGoogleSheetsRequest({
                  action: 'getRowBySubmittedAt',
                  env,
                  submittedAt
                });

                if (rowData.success) {
                  const [driverName, thaiDate, dayOfWeek, clockIn, clockOut, otStart, otEnd, comments, submittedAtValue] = rowData.row;
                  const payload = {
                    driverName,
                    thaiDate,
                    clockIn,
                    clockOut,
                    otStart,
                    otEnd,
                    comments,
                    submittedAt: submittedAtValue,
                    env
                  };

                  // Re-trigger submission
                  await handleGoogleSheetsRequest(payload);
                }
              }
            } catch (error) {
              console.error('Error processing approval:', error);
            }
          }
          
          if (/^Approve$/i.test(text)) {
            console.log('Sending approveMostRecent');
            try {
              const result = await handleGoogleSheetsRequest({
                action: 'approveMostRecent',
                env,
              });
              console.log('approveMostRecent result:', result);
            } catch (error) {
              console.error('Error processing approveMostRecent:', error);
            }
          }
          // You can add Deny logic here later
        }
      }
    }
  }
  res.sendStatus(200);
};

// Helper function to get manager user IDs by environment
function getManagerUserIds(env) {
  if (env === 'dev') {
    return (MANAGER_USER_IDS_DEV || '').split(',').map(id => id.trim()).filter(Boolean);
  } else {
    return (MANAGER_USER_IDS_PROD || '').split(',').map(id => id.trim()).filter(Boolean);
  }
}
*/

// Placeholder for Phase 2 implementation
export const handleWebhook = async (req, res) => {
  console.log('=== WEBHOOK: Phase 2 Implementation Pending ===');
  res.sendStatus(200);
}; 