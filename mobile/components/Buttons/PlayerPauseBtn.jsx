import Svg, { Path } from 'react-native-svg';
import { Pressable} from 'react-native';

export default function PlayerPauseBtn(props) {
    return (
      <Pressable onPress={props.onPress}>
        <Svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" {...props}>
          <Path fill="#ffffff" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></Path>
        </Svg>
      </Pressable>
      
    )
}

