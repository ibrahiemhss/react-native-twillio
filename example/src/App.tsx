import * as React from 'react';

import {
  Button,
  PermissionsAndroid,
  Platform,
  TextInput,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  TwilioVideo,
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
} from 'react-native-twillio';
import { useRef, useState } from 'react';
import styles from './styles';

export default function App() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [participants, setParticipants] = useState(new Map());
  const [videoTracks, setVideoTracks] = useState(new Map());
  const [token, setToken] = useState('');
  const twilioVideo = useRef(null);

  const _onConnectButtonPress = async () => {
    if (Platform.OS === 'android') {
      await _requestAudioPermission();
      await _requestCameraPermission();
    }
    twilioVideo.current.connect({
      accessToken: token,
      enableNetworkQualityReporting: true,
      dominantSpeakerEnabled: true,
    });
    setStatus('connecting');
  };

  const _onEndButtonPress = () => {
    twilioVideo.current.disconnect();
  };

  const _onMuteButtonPress = () => {
    twilioVideo.current
      .setLocalAudioEnabled(!isAudioEnabled)
      .then((isEnabled) => setIsAudioEnabled(isEnabled));
  };

  const _onShareButtonPressed = () => {
    twilioVideo.current.toggleScreenSharing(!isSharing);
    setIsSharing(!isSharing);
  };

  const _onFlipButtonPress = () => {
    twilioVideo.current.flipCamera();
  };

  const _onRoomDidConnect = () => {
    setStatus('connected');
  };

  const _onRoomDidDisconnect = ({ error }) => {
    console.log('ERROR: ', error);

    setStatus('disconnected');
  };

  const _onRoomDidFailToConnect = (error) => {
    console.log('ERROR: ', error);

    setStatus('disconnected');
  };

  const _onParticipantAddedVideoTrack = ({ participant, track }) => {
    console.log('onParticipantAddedVideoTrack: ', participant, track);

    setVideoTracks(
      new Map([
        ...videoTracks,
        [
          track.trackSid,
          { participantSid: participant.sid, videoTrackSid: track.trackSid },
        ],
      ])
    );
  };

  const _onParticipantRemovedVideoTrack = ({ participant, track }) => {
    console.log('onParticipantRemovedVideoTrack: ', participant, track);

    const newVideoTracks = new Map(videoTracks);
    newVideoTracks.delete(track.trackSid);

    setVideoTracks(newVideoTracks);
  };

  const _onNetworkLevelChanged = ({ participant, isLocalUser, quality }) => {
    console.log(
      'Participant',
      participant,
      'isLocalUser',
      isLocalUser,
      'quality',
      quality
    );
  };

  const _onDominantSpeakerDidChange = ({ roomName, roomSid, participant }) => {
    console.log(
      'onDominantSpeakerDidChange',
      `roomName: ${roomName}`,
      `roomSid: ${roomSid}`,
      'participant:',
      participant
    );
  };

  const _requestAudioPermission = () => {
    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Need permission to access microphone',
        message:
          'To run this demo we need permission to access your microphone',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
  };

  const _requestCameraPermission = () => {
    return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
      title: 'Need permission to access camera',
      message: 'To run this demo we need permission to access your camera',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    });
  };

  return (
    <View style={styles.container}>
      {status === 'disconnected' && (
        <View>
          <Text style={styles.welcome}>React Native Twilio Video</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={token}
            onChangeText={(text) => setToken(text)}
          />
          <Button
            title="Connect"
            style={styles.button}
            onPress={_onConnectButtonPress}
          />
        </View>
      )}

      {(status === 'connected' || status === 'connecting') && (
        <View style={styles.callContainer}>
          {status === 'connected' && (
            <View style={styles.remoteGrid}>
              {Array.from(videoTracks, ([trackSid, trackIdentifier]) => {
                return (
                  <TwilioVideoParticipantView
                    style={styles.remoteVideo}
                    key={trackSid}
                    trackIdentifier={trackIdentifier}
                  />
                );
              })}
            </View>
          )}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={_onEndButtonPress}
            >
              <Text style={{ fontSize: 12 }}>End</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={_onMuteButtonPress}
            >
              <Text style={{ fontSize: 12 }}>
                {isAudioEnabled ? 'Mute' : 'Unmute'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={_onFlipButtonPress}
            >
              <Text style={{ fontSize: 12 }}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={_onShareButtonPressed}
            >
              <Text style={{ fontSize: 12 }}>
                {isSharing ? 'Stop Sharing' : 'Start Sharing'}
              </Text>
            </TouchableOpacity>
            <TwilioVideoLocalView enabled={true} style={styles.localVideo} />
          </View>
        </View>
      )}

      <TwilioVideo
        ref={twilioVideo}
        onRoomDidConnect={_onRoomDidConnect}
        onRoomDidDisconnect={_onRoomDidDisconnect}
        onRoomDidFailToConnect={_onRoomDidFailToConnect}
        onParticipantAddedVideoTrack={_onParticipantAddedVideoTrack}
        onParticipantRemovedVideoTrack={_onParticipantRemovedVideoTrack}
        onNetworkQualityLevelsChanged={_onNetworkLevelChanged}
        onDominantSpeakerDidChange={_onDominantSpeakerDidChange}
      />
    </View>
  );
}
