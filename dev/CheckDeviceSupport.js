var MediaDevices = [];

var audioInputDevices = [];
var audioOutputDevices = [];
var videoInputDevices = [];

if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    // Firefox 38+ seems having support of enumerateDevices
    // Thanks @xdumaine/enumerateDevices
    navigator.enumerateDevices = function(callback) {
        navigator.mediaDevices.enumerateDevices().then(callback);
    };
}

// ---------- Media Devices detection
var canEnumerate = false;

/*global MediaStreamTrack:true */
if(typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
    canEnumerate = true;
}

else if(navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
    canEnumerate = true;
}

var hasMicrophone = false;
var hasSpeakers = false;
var hasWebcam = false;

var isWebsiteHasMicrophonePermissions = false;
var isWebsiteHasWebcamPermissions = false;

// http://dev.w3.org/2011/webrtc/editor/getusermedia.html#mediadevices
// todo: switch to enumerateDevices when landed in canary.
function checkDeviceSupport(callback) {
    if(!canEnumerate) {
        return;
    }

    // This method is useful only for Chrome!

    if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
        navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
    }

    if (!navigator.enumerateDevices && navigator.enumerateDevices) {
        navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
    }

    if (!navigator.enumerateDevices) {
        if (callback) {
            callback();
        }
        return;
    }

    MediaDevices = [];

    audioInputDevices = [];
    audioOutputDevices = [];
    videoInputDevices = [];

    navigator.enumerateDevices(function(devices) {
        devices.forEach(function(_device) {
            var device = {};
            for (var d in _device) {
                device[d] = _device[d];
            }

            // if it is MediaStreamTrack.getSources
            if (device.kind === 'audio') {
                device.kind = 'audioinput';
            }

            if (device.kind === 'video') {
                device.kind = 'videoinput';
            }

            var skip;
            MediaDevices.forEach(function(d) {
                if (d.id === device.id && d.kind === device.kind) {
                    skip = true;
                }
            });

            if (skip) {
                return;
            }

            if (!device.deviceId) {
                device.deviceId = device.id;
            }

            if (!device.id) {
                device.id = device.deviceId;
            }

            if (!device.label) {
                device.label = 'Please invoke getUserMedia once.';
                if(location.protocol !== 'https:') {
                    device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
                }
            } else {
                if (device.kind === 'videoinput' && !isWebsiteHasWebcamPermissions) {
                    isWebsiteHasWebcamPermissions = true;
                }

                if (device.kind === 'audioinput' && !isWebsiteHasMicrophonePermissions) {
                    isWebsiteHasMicrophonePermissions = true;
                }
            }

            if (device.kind === 'audioinput') {
                hasMicrophone = true;
                audioInputDevices.push(device);
            }

            if (device.kind === 'audiooutput') {
                hasSpeakers = true;
                audioOutputDevices.push(device);
            }

            if (device.kind === 'videoinput') {
                hasWebcam = true;
                videoInputDevices.push(device);
            }

            // there is no 'videoouput' in the spec.

            MediaDevices.push(device);
        });

        if(typeof DetectRTC !== 'undefined') {
            // to sync latest outputs
            DetectRTC.MediaDevices = MediaDevices;
            DetectRTC.hasMicrophone = hasMicrophone;
            DetectRTC.hasSpeakers = hasSpeakers;
            DetectRTC.hasWebcam = hasWebcam;

            DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions;
            DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions;

            DetectRTC.audioInputDevices = audioInputDevices;
            DetectRTC.audioOutputDevices = audioOutputDevices;
            DetectRTC.videoInputDevices = videoInputDevices;
        }

        if (callback) {
            callback();
        }
    });
}

// check for microphone/camera support!
checkDeviceSupport();
