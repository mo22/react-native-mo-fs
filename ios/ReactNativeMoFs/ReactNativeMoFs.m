#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <React/RCTUIManager.h>
#import <React/RCTNetworking.h>
#import <CommonCrypto/CommonDigest.h>
#import <CoreServices/CoreServices.h>
#import <objc/runtime.h>

#if __has_include(<RCTBlob/RCTBlobManager.h>)
#import <RCTBlob/RCTBlobManager.h>
#else
#import "RCTBlobManager.h"
#endif

static void methodSwizzle(Class cls1, SEL sel1, Class cls2, SEL sel2) {
    Method m1 = class_getInstanceMethod(cls1, sel1); // original
    Method m2 = class_getInstanceMethod(cls2, sel2); // new
    assert(m2);
    if (m1) {
        assert(class_addMethod(cls1, sel2, method_getImplementation(m1), method_getTypeEncoding(m1)));
        method_exchangeImplementations(m1, m2);
    } else {
        assert(class_addMethod(cls1, sel1, method_getImplementation(m2), method_getTypeEncoding(m2)));
    }
}

NSString* utiForPath(NSString* path) {
    return CFBridgingRelease(UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef _Nonnull)([path pathExtension]), nil));
}

NSString* utiForMimeType(NSString* mimeType) {
    return CFBridgingRelease(UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (__bridge CFStringRef _Nonnull)mimeType, NULL));
}

NSString* mimeTypeForPath(NSString* path) {
    NSString* uti = utiForPath(path);
    NSString* mime = CFBridgingRelease(UTTypeCopyPreferredTagWithClass((__bridge CFStringRef _Nonnull)(uti), kUTTagClassMIMEType));
    if (!mime) return @"application/octet-stream";
    return mime;
}



@interface ReactNativeMoFsInteractionDelegate : NSObject <UIDocumentInteractionControllerDelegate>
@property RCTPromiseResolveBlock resolve;
@property RCTPromiseRejectBlock reject;
@property NSMutableSet* refs;
@end
@implementation ReactNativeMoFsInteractionDelegate
- (void)documentInteractionControllerDidDismissOpenInMenu:(UIDocumentInteractionController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
- (void)documentInteractionControllerDidDismissOptionsMenu:(UIDocumentInteractionController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
- (void)documentInteractionControllerDidEndPreview:(UIDocumentInteractionController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
- (void)documentInteractionController:(UIDocumentInteractionController *)controller willBeginSendingToApplication:(nullable NSString *)application {
    // not called?
    NSLog(@"willBeginSendingToApplication");
}
- (void)documentInteractionController:(UIDocumentInteractionController *)controller didEndSendingToApplication:(nullable NSString *)application {
    // not called?
    NSLog(@"didEndSendingToApplication");
}
- (UIViewController *)documentInteractionControllerViewControllerForPreview:(UIDocumentInteractionController *)controller {
    return RCTSharedApplication().delegate.window.rootViewController;
}
@end



@interface ReactNativeMoFsPickerDelegate : NSObject <UIDocumentPickerDelegate>
@property RCTPromiseResolveBlock resolve;
@property RCTPromiseRejectBlock reject;
@property NSMutableSet* refs;
@end
@implementation ReactNativeMoFsPickerDelegate
- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentsAtURLs:(NSArray <NSURL *>*)urls {
    NSMutableArray* res = [NSMutableArray new];
    for (NSURL* url in urls) {
        [res addObject:[url absoluteString]];
    }
    self.resolve(res);
    [self.refs removeObject:self];
}
- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
}
@end



@interface ReactNativeMoFs : RCTEventEmitter
@property NSMutableSet* refs;
@end

@implementation ReactNativeMoFs

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ @"ReactNativeMoFsLink" ];
}

- (instancetype)init {
    self = [super init];
    if (self) {
        self.refs = [NSMutableSet new];
        static id<UIApplicationDelegate> appDelegate;
        if (appDelegate == nil) {
            NSLog(@"XXX swizzle openURL");
            appDelegate = RCTSharedApplication().delegate;
            methodSwizzle(
                [appDelegate class], @selector(application:openURL:options:),
                [self class],@selector(swizzled_application:openURL:options:)
            );
            [UIApplication sharedApplication].delegate = nil;
            RCTSharedApplication().delegate = appDelegate;
        }
    }
    return self;
}

- (BOOL)swizzled_application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
    NSLog(@"XXX application openURL %@ options %@", url, options);
    RCTBridge* bridge = ((RCTRootView*)RCTSharedApplication().delegate.window.rootViewController.view).bridge;
    NSLog(@"bridge %@", bridge);
    // @TODO: need to remember this
    ReactNativeMoFs* realself = [bridge moduleForClass:[ReactNativeMoFs class]];
    [realself sendEventWithName:@"ReactNativeMoFsLink" body:@{
        @"url": [url absoluteString],
        @"options": options,
    }];
    if ([self respondsToSelector:@selector(swizzled_application:openURL:options:)]) {
        return [self swizzled_application:application openURL:url options:options];
    } else {
        return NO;
    }
}

- (NSDictionary *)constantsToExport {
    NSMutableDictionary* constants = [NSMutableDictionary new];
    constants[@"paths"] = @{
        @"bundle": [[NSBundle mainBundle] bundlePath],
        @"document": [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject],
        @"caches": [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject],
    };
    return constants;
}

RCT_EXPORT_METHOD(getMimeType:(NSString*)extension resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(mimeTypeForPath(extension));
}

RCT_EXPORT_METHOD(getUtiFromMimeType:(NSString*)mimeType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(utiForMimeType(mimeType));
}

RCT_EXPORT_METHOD(getUti:(NSString*)extension resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(utiForPath(extension));
}

RCT_EXPORT_METHOD(readBlob:(NSDictionary<NSString*,id>*)blob mode:(NSString*)mode resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    if ([mode isEqualToString:@"base64"]) {
        NSString* res = [data base64EncodedStringWithOptions:0];
        resolve(res);
    } else if ([mode isEqualToString:@"utf8"]) {
        NSString* res = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        resolve(res);
    } else {
        reject(@"", @"invalid mode", nil);
        return;
    }
}

RCT_EXPORT_METHOD(createBlob:(NSString*)str mode:(NSString*)mode resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data;
    if ([mode isEqualToString:@"base64"]) {
        data = [[NSData alloc] initWithBase64EncodedString:str options:0];
        if (!data) {
            reject(@"", @"invalid base64", nil);
            return;
        }
    } else if ([mode isEqualToString:@"utf8"]) {
        data = [str dataUsingEncoding:NSUTF8StringEncoding];
    } else {
        reject(@"", @"invalid mode", nil);
        return;
    }
    NSString* blobId = [blobManager store:data];
    resolve(@{
        @"size": @([data length]),
        @"offset": @(0),
        @"blobId": blobId,
    });
}

RCT_EXPORT_METHOD(readFile:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSError* error = nil;
    NSData* data = [NSData dataWithContentsOfFile:path options:0 error:&error];
    if (!data) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    NSString* blobId = [blobManager store:data];
    resolve(@{
        @"size": @([data length]),
        @"offset": @(0),
        @"blobId": blobId,
        @"type": mimeTypeForPath(path),
        @"name": [path lastPathComponent],
    });
}

RCT_EXPORT_METHOD(writeFile:(NSString*)path blob:(NSDictionary<NSString*,id>*)blob resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    NSError* error = nil;
    [data writeToFile:path options:NSDataWritingAtomic error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(appendFile:(NSString*)path blob:(NSDictionary<NSString*,id>*)blob resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    NSError* error = nil;
    if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
        [[NSFileManager defaultManager] createFileAtPath:path contents:nil attributes:nil];
    }
    NSFileHandle* fp = [NSFileHandle fileHandleForWritingToURL:[NSURL fileURLWithPath:path] error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    if (@available(iOS 13.0, *)) {
        [fp seekToEndReturningOffset:nil error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        [fp writeData:data error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        [fp closeAndReturnError:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
    } else {
        [fp seekToEndOfFile];
        [fp writeData:data];
        [fp closeFile];
    }
    resolve(nil);
}

- (BOOL)deleteRecursive:(NSString*)path error:(NSError**)error {
    NSError* err = nil;
    BOOL dir = NO;
    if (![[NSFileManager defaultManager] fileExistsAtPath:path isDirectory:&dir]) {
        return YES;
    }
    if (dir) {
        NSArray* files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&err];
        if (err) {
            if (error) *error = err;
            return NO;
        }
        for (NSString* file in files) {
            BOOL res = [self deleteRecursive:[path stringByAppendingPathComponent:file] error:error];
            if (!res) return NO;
        }
    }
    [[NSFileManager defaultManager] removeItemAtPath:path error:&err];
    if (err) {
        if (error) *error = err;
        return NO;
    }
    return YES;
}

RCT_EXPORT_METHOD(deleteFile:(NSString*)path recursive:(BOOL)recursive resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    if (recursive) {
        [self deleteRecursive:path error:&error];
    } else {
        [[NSFileManager defaultManager] removeItemAtPath:path error:&error];
    }
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(renameFile:(NSString*)path to:(NSString*)path2 resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    [[NSFileManager defaultManager] moveItemAtPath:path toPath:path2 error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(listDir:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    NSArray<NSString*>* entries = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(entries);
}

RCT_EXPORT_METHOD(createDir:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(stat:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSMutableDictionary<NSFileAttributeKey, id>* stat = [NSMutableDictionary dictionaryWithDictionary:[[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error]];
        if (stat[NSFileModificationDate]) {
            stat[NSFileModificationDate] = @([stat[NSFileModificationDate] timeIntervalSince1970]);
        }
        if (stat[NSFileCreationDate]) {
            stat[NSFileCreationDate] = @([stat[NSFileCreationDate] timeIntervalSince1970]);
        }
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        resolve(stat);
    } else {
        resolve(nil);
    }
}

RCT_EXPORT_METHOD(getBlobInfo:(NSDictionary<NSString*,id>*)blob args:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    NSMutableDictionary* res = [NSMutableDictionary new];
    res[@"size"] = @([data length]);
    if (args[@"sha1"]) {
        uint8_t digest[CC_SHA1_DIGEST_LENGTH];
        CC_SHA1(data.bytes, (CC_LONG)data.length, digest);
        NSMutableString *output = [NSMutableString stringWithCapacity:CC_SHA1_DIGEST_LENGTH * 2];
        for (int i = 0; i < CC_SHA1_DIGEST_LENGTH; i++) [output appendFormat:@"%02x", digest[i]];
        res[@"sha1"] = output;
    }
    if (args[@"md5"]) {
        uint8_t digest[CC_MD5_DIGEST_LENGTH];
        CC_MD5(data.bytes, (CC_LONG)data.length, digest);
        NSMutableString *output = [NSMutableString stringWithCapacity:CC_MD5_DIGEST_LENGTH * 2];
        for (int i = 0; i < CC_MD5_DIGEST_LENGTH; i++) [output appendFormat:@"%02x", digest[i]];
        res[@"md5"] = output;
    }
    if (args[@"sha256"]) {
        uint8_t digest[CC_SHA256_DIGEST_LENGTH];
        CC_SHA256(data.bytes, (CC_LONG)data.length, digest);
        NSMutableString *output = [NSMutableString stringWithCapacity:CC_SHA256_DIGEST_LENGTH * 2];
        for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++) [output appendFormat:@"%02x", digest[i]];
        res[@"sha256"] = output;
    }
    if (args[@"image"]) {
        CIImage* image = [CIImage imageWithData:data];
        if (image) {
            res[@"image"] = @{
                @"width": @(image.extent.size.width),
                @"height": @(image.extent.size.height),
            };
        }
    }
    if (args[@"exif"]) {
        CIImage* image = [CIImage imageWithData:data];
        if (image) {
            res[@"exif"] = image.properties;
        }
    }
    resolve(res);
}

RCT_EXPORT_METHOD(updateImage:(NSDictionary<NSString*,id>*)blob args:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    CIImage* image = [CIImage imageWithData:data];
    if (!image) {
        reject(@"", @"blob not an image", nil);
        return;
    }
    if (args[@"matrix"]) {
        // input: [ a b tx ]
        //        [ c d ty ]
        //        [ _ _ _ ]
        CGAffineTransform transform = CGAffineTransformMake(
            [args[@"matrix"][0] floatValue],
            [args[@"matrix"][1] floatValue],
            [args[@"matrix"][3] floatValue],
            [args[@"matrix"][4] floatValue],
            [args[@"matrix"][2] floatValue],
            [args[@"matrix"][5] floatValue]
        );
        image = [image imageByApplyingTransform:transform];
    }
    if (args[@"width"]) {
        image = [image imageByCroppingToRect:CGRectMake(0, 0, [args[@"width"] floatValue], [args[@"height"] floatValue])];
    }
    UIImage* uiImage = [UIImage imageWithCGImage:[[CIContext new] createCGImage:image fromRect:image.extent]];
    NSData* output = nil;
    if ([args[@"encoding"] isEqualToString:@"png"]) {
        output = UIImagePNGRepresentation(uiImage);
    } else {
        output = UIImageJPEGRepresentation(uiImage, [args[@"quality"] floatValue]);
    }
    NSString* blobId = [blobManager store:output];
    resolve(@{
        @"size": @([output length]),
        @"offset": @(0),
        @"blobId": blobId,
        @"type": [args[@"encoding"] isEqualToString:@"png"] ? @"image/png" : @"image/jpeg",
        @"name": blob[@"name"],
    });
}

RCT_EXPORT_METHOD(showDocumentInteractionController:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIView* view = RCTSharedApplication().delegate.window.rootViewController.view;
        NSString* path = args[@"path"];
        NSURL* url = [NSURL fileURLWithPath:path];
        UIDocumentInteractionController* controller = [UIDocumentInteractionController interactionControllerWithURL:url];
        if (args[@"uti"]) {
            controller.UTI = args[@"uti"];
        }
        if (args[@"annotation"]) {
            controller.annotation = args[@"annotation"];
        }
        if (args[@"name"]) {
            controller.name = args[@"name"];
        }
        ReactNativeMoFsInteractionDelegate* delegate = [ReactNativeMoFsInteractionDelegate new];
        delegate.resolve = resolve;
        delegate.reject = reject;
        delegate.refs = self.refs;
        [self.refs addObject:delegate];
        [self.refs addObject:controller];
        controller.delegate = delegate;
        if ([args[@"type"] isEqualToString:@"preview"]) {
            [controller presentPreviewAnimated:YES];
        } else if ([args[@"type"] isEqualToString:@"openin"]) {
            [controller presentOpenInMenuFromRect:CGRectZero inView:view animated:YES];
        } else if ([args[@"type"] isEqualToString:@"options"]) {
            [controller presentOptionsMenuFromRect:CGRectZero inView:view animated:YES];
        } else {
            reject(@"", @"invalid type", nil);
        }
    });
}

RCT_EXPORT_METHOD(showDocumentPickerView:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSMutableArray* utis = [NSMutableArray new];
        if (args[@"utis"]) {
            [utis addObjectsFromArray:args[@"utis"]];
        } else {
            [utis addObject:@"public.item"]; // public.data public.item public.content
        }
        UIDocumentPickerViewController* controller = [[UIDocumentPickerViewController alloc] initWithDocumentTypes:utis inMode:UIDocumentPickerModeImport];
        ReactNativeMoFsPickerDelegate* delegate = [ReactNativeMoFsPickerDelegate new];
        delegate.resolve = resolve;
        delegate.reject = reject;
        delegate.refs = self.refs;
        [self.refs addObject:delegate];
        controller.delegate = delegate;
        controller.modalPresentationStyle = UIModalPresentationFormSheet;
        if (@available(iOS 11.0, *)) {
            controller.allowsMultipleSelection = [args[@"multiple"] boolValue];
        }
        [RCTSharedApplication().delegate.window.rootViewController presentViewController:controller animated:YES completion:nil];
    });
}

@end
