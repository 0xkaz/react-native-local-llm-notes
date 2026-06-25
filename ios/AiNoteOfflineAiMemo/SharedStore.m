#import "SharedStore.h"

static NSString *const kGroup = @"group.org.reactjs.native.example.AiNoteOfflineAiMemo";
static NSString *const kKey = @"pendingSharedText";

@implementation SharedStore

RCT_EXPORT_MODULE();

// Returns the pending shared text (if any) and clears it. Empty string if none.
RCT_EXPORT_METHOD(consumePendingSharedText:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSUserDefaults *d = [[NSUserDefaults alloc] initWithSuiteName:kGroup];
  NSString *text = [d stringForKey:kKey];
  if (text != nil) {
    [d removeObjectForKey:kKey];
  }
  resolve(text ?: @"");
}

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
