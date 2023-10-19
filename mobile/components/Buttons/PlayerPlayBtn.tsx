import Svg, { Path } from 'react-native-svg';
import { Pressable} from 'react-native';

export default function PlayerPlayBtn(props) {
    return (
      <Pressable onPress={props.onPress}>
        <Svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" {...props}>
          <Path fill="#ffffff" d="M8 5v14l11-7z"></Path>
        </Svg>
      </Pressable>
      
    )
}