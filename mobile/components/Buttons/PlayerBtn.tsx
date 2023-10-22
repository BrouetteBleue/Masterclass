import React from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PlayerBtnProps {
  svgPaths: string[];
  fill?: string;
  onPress: () => void;
  viewBox?: string;
  size: number;
  [key: string]: any;  // Pour les propriétés supplémentaires
}

const PlayerBtn: React.FC<PlayerBtnProps> = ({ svgPaths, fill, onPress, viewBox, size, ...restProps }) => {
  return (
    <Pressable onPress={onPress} >
      <Svg width={size} height={size} viewBox={viewBox || "0 0 24 24"} {...restProps}>
        {svgPaths.map((path, index) => (
          <Path key={index} fill={fill || "#ffffff"} d={path} />
        ))}
      </Svg>
    </Pressable>
  )
}

export default PlayerBtn;
