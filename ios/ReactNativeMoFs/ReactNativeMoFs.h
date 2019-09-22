#import <UIKit/UIKit.h>
#import <React/RCTEventEmitter.h>

@interface ReactNativeMoFs : RCTEventEmitter

+ (void)disableAutoSwizzle;
+ (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

@end
