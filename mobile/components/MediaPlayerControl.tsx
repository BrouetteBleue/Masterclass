import React, {useState, useEffect, useRef} from 'react';
import {View, TouchableWithoutFeedback} from 'react-native';
import PlayerBtn from './Buttons/PlayerBtn';

interface MediaPlayerControlProps {
  isMediaControlVisible: boolean;
  handleTap: () => void;
  handleSkipBackward: () => void;
  handlePlay: () => void;
  handleSkipForward: () => void;
  handleMute: () => void;
  handleLoop: () => void;
  handleFullScreen: () => void;
  loopState: LoopState;
  isFullScreen: boolean;
  isMuted: boolean;
  isPlaying: boolean;
}

export enum LoopState {
  NoLoop = 0,
  Loop1 = 1,
  Loop2 = 2,
}

const MediaPlayerControl: React.FC<MediaPlayerControlProps> = ({
  isMediaControlVisible,
  handleTap,
  handleSkipBackward,
  handlePlay,
  handleSkipForward,
  handleMute,
  handleLoop,
  handleFullScreen,
  loopState,
  isFullScreen,
  isMuted,
  isPlaying,
}) => {
  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}>
        {isMediaControlVisible && (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // Opacité seulement pour le fond
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                width: '100%',
                height: '60%',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}>
              <PlayerBtn
                style={{transform: [{rotate: '180deg'}]}}
                onPress={handleSkipBackward}
                svgPaths={['m6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z']}
                size={50}
              />
              {isPlaying ? (
                <PlayerBtn
                  style={{marginRight: 30, marginLeft: 30}}
                  onPress={handlePlay}
                  svgPaths={['M6 19h4V5H6v14zm8-14v14h4V5h-4z']}
                  size={50}
                />
              ) : (
                <PlayerBtn
                  style={{marginRight: 30, marginLeft: 30}}
                  onPress={handlePlay}
                  svgPaths={['M8 5v14l11-7z']}
                  size={50}
                />
              )}
              <PlayerBtn
                onPress={handleSkipForward}
                svgPaths={['m6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z']}
                size={50}
              />
            </View>

            <View
              style={{
                width: '100%',
                height: '40%',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
                paddingBottom: 10,
              }}>
              {/* Volume */}
              {isMuted ? (
                <PlayerBtn
                  style={{marginRight: 10, marginLeft: 10}}
                  onPress={handleMute}
                  svgPaths={[
                    'M15.4 16L14 14.6l2.6-2.6L14 9.4L15.4 8l2.6 2.6L20.6 8L22 9.4L19.4 12l2.6 2.6l-1.4 1.4l-2.6-2.6l-2.6 2.6ZM3 15V9h4l5-5v16l-5-5H3Z',
                  ]}
                  size={25}
                />
              ) : (
                <PlayerBtn
                  style={{marginRight: 10, marginLeft: 10}}
                  onPress={handleMute}
                  svgPaths={[
                    'M14 20.725v-2.05q2.25-.65 3.625-2.5t1.375-4.2q0-2.35-1.375-4.2T14 5.275v-2.05q3.1.7 5.05 3.138T21 11.975q0 3.175-1.95 5.613T14 20.725ZM3 15V9h4l5-5v16l-5-5H3Zm11 1V7.95q1.175.55 1.838 1.65T16.5 12q0 1.275-.663 2.363T14 16Z',
                  ]}
                  size={25}
                />
              )}

              {/* Loop */}
              {loopState === LoopState.NoLoop ||
              loopState === LoopState.Loop1 ? (
                <PlayerBtn
                  style={{marginRight: 10, marginLeft: 10}}
                  onPress={handleLoop}
                  svgPaths={[
                    'M464 210.511V264a112.127 112.127 0 0 1-112 112H78.627l44.686-44.687l-22.626-22.626L56 353.373l-4.415 4.414l-33.566 33.567l74.022 83.276l23.918-21.26L75.63 408H352c79.4 0 144-64.6 144-144v-85.489Z',
                    'M48 256a112.127 112.127 0 0 1 112-112h273.373l-44.686 44.687l22.626 22.626L456 166.627l4.117-4.116l33.864-33.865l-74.022-83.276l-23.918 21.26L436.37 112H160c-79.4 0-144 64.6-144 144v85.787l32-32Z',
                  ]}
                  viewBox="0 0 512 512"
                  fill={loopState === LoopState.Loop1 ? 'red' : 'white'}
                  size={25}
                />
              ) : (
                <PlayerBtn
                  style={{marginRight: 10, marginLeft: 10}}
                  onPress={handleLoop}
                  svgPaths={[
                    'M208 312v32h112v-32h-40V176h-32v24h-32v32h32v80h-40z',
                    'M464 210.511V264a112.127 112.127 0 0 1-112 112H78.627l44.686-44.687l-22.626-22.626L56 353.373l-4.415 4.414l-33.566 33.567l74.022 83.276l23.918-21.26L75.63 408H352c79.4 0 144-64.6 144-144v-85.489Z',
                    'M48 256a112.127 112.127 0 0 1 112-112h273.373l-44.686 44.687l22.626 22.626L456 166.627l4.117-4.116l33.864-33.865l-74.022-83.276l-23.918 21.26L436.37 112H160c-79.4 0-144 64.6-144 144v85.787l32-32Z',
                  ]}
                  viewBox="0 0 512 512"
                  size={25}
                  fill="red"
                />
              )}

              {/* FullScreen pour l'instant on utilise le fullScreen natif car : fleme  donc le changement d'icone pas utilisé (mais au moins c prêt)*/}
              {isFullScreen ? (
                <PlayerBtn
                  style={{marginRight: 10, marginLeft: 10}}
                  onPress={handleFullScreen}
                  svgPaths={[
                    'M204 181.372L38.628 16H16v22.628L181.372 204H44v32h192V44h-32v137.372zM326.628 304H464v-32H272v192h32V326.628L473.372 496H496v-22.628L326.628 304z',
                  ]}
                  fill="red"
                  viewBox="0 0 512 512"
                  size={25}
                />
              ) : (
                <PlayerBtn
                  style={{marginRight: 10, marginLeft: 10}}
                  onPress={handleFullScreen}
                  svgPaths={[
                    'M208 48V16H16v192h32V70.627l160.687 160.686l22.626-22.626L70.627 48H208zm256 256v137.373L299.313 276.687l-22.626 22.626L441.373 464H304v32h192V304h-32z',
                  ]}
                  viewBox="0 0 512 512"
                  size={25}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MediaPlayerControl;
